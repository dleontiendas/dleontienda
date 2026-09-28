import { commerceItem } from "./catalogContract";
import { readConsent } from "../consent/consentStorage";

let consent = false;
const sent = new Set();
const permittedNames = new Set(["PageView", "ViewContent", "Search", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Purchase"]);
// No UI or implicit consent: the future consent manager must call this explicitly.
export function setMetaConsent(allowed) {
  consent = allowed === true;
  try {
    if (!consent && window.fbq) window.fbq("consent", "revoke");
    if (!consent && window.fbq?.queue) window.fbq.queue = window.fbq.queue.filter(args => args[0] !== "trackSingle");
  } catch { /* Tracking can never interrupt the storefront. */ }
}
export function metaAllowed() {
  return consent && process.env.REACT_APP_META_ENABLED === "true"
    && /^\d+$/.test(process.env.REACT_APP_META_PIXEL_ID || "")
    && typeof window !== "undefined" && window.location.hostname === "dleongold.com";
}
function publicPage() {
  if (/^\/(?:dashboard|login|register)(?:\/|$)/.test(window.location.pathname)) return false;
  const params = new URLSearchParams(window.location.search);
  return [...params].every(([key, value]) =>
    ["variant", "ref", "v", "departamento", "categoria", "subcategoria"].includes(key) &&
    /^[A-Za-z0-9:_%_.!~*'() -]{1,200}$/.test(value)
  );
}
function initialize() {
  if (!metaAllowed()) return false;
  if (!window.fbq) {
    const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0"; fbq.push = fbq;
    window.fbq = fbq; window._fbq = fbq;
    const script = document.createElement("script");
    script.id = "dleon-meta-pixel"; script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onerror = () => { fbq.queue = []; };
    document.head.appendChild(script);
    fbq("set", "autoConfig", false, process.env.REACT_APP_META_PIXEL_ID);
    fbq("init", process.env.REACT_APP_META_PIXEL_ID);
  }
  window.fbq("consent", "grant");
  return true;
}
export function newEventId() { return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function trackMeta(name, data = {}, eventId = newEventId()) {
  try {
    if (!permittedNames.has(name) || !metaAllowed() || !publicPage()) return false;
    const key = `${name}:${eventId}`;
    if (sent.has(key) || (name === "Purchase" && localStorage.getItem(`meta:${key}`))) return false;
    if (!initialize()) return false;
    // Explicit allowlist. Never forward forms, arbitrary URLs, tokens or customer data.
    const clean = { currency: "COP" };
    for (const field of ["content_ids", "content_name", "content_type", "contents", "value", "num_items", "search_string", "order_id", "payment_method"]) {
      if (data[field] !== undefined) clean[field] = data[field];
    }
    window.fbq("trackSingle", process.env.REACT_APP_META_PIXEL_ID, name, clean, { eventID: eventId });
    sent.add(key);
    if (name === "Purchase") localStorage.setItem(`meta:${key}`, "1");
    return true;
  } catch { return false; }
}
export function commerceData(items, name) {
  if (!items.length || items.some(item => !item)) return null;
  return { content_ids: items.map(item => item.id), content_type: "product", ...(name ? { content_name: name } : {}),
    contents: items, value: items.reduce((sum, item) => sum + item.item_price * item.quantity, 0), num_items: items.reduce((sum, item) => sum + item.quantity, 0), currency: "COP" };
}
export function trackProduct(name, product, color, size, quantity = 1, eventId) {
  const item = commerceItem(product, color, size, quantity);
  const data = commerceData(item ? [item] : [], product?.name);
  if (data) trackMeta(name, data, eventId);
}
export function trackSearch(term, products) {
  // Search text is free-form and may contain personal data. Send matched IDs only.
  const items = products.flatMap(product => {
    const variant = product.variants?.find(v => v.active !== false && v.tallas?.some(s => Number(s.stock) > 0));
    const size = variant?.tallas?.find(s => s.active !== false && Number(s.stock) > 0);
    const item = commerceItem(product, variant?.color, size?.size);
    return item ? [item] : [];
  });
  if (String(term).trim()) trackMeta("Search", { content_ids: items.map(item => item.id), content_type: "product" });
}
export function checkoutTracking() {
  if (!metaAllowed()) return undefined;
  const read = name => document.cookie.split("; ").find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
  const record = readConsent();
  if (!record?.marketing) return undefined;
  return {
    consent: true,
    policyVersion: "meta-v1",
    consentVersion: record.version,
    consentAt: record.decidedAt,
    fbp: read("_fbp") || null,
    fbc: read("_fbc") || null,
  };
}
export function trackPurchase(order) {
  if (!order?.metaPurchase) return false;
  const { eventId, data } = order.metaPurchase;
  return trackMeta("Purchase", data, eventId);
}
