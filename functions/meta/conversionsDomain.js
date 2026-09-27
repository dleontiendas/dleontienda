export function trackingEnabled(env = process.env) {
  return env.META_ENABLED === "true" && env.META_CONSENT_READY === "true"
    && !env.FIRESTORE_EMULATOR_HOST && !env.FUNCTIONS_EMULATOR;
}
export function sanitizeTracking(input, enabled = trackingEnabled()) {
  if (!enabled || input?.consent !== true || input.policyVersion !== "meta-v1") return null;
  const cookie = value => typeof value === "string" && /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_-]{1,200}$/.test(value) ? value : null;
  const fbp = cookie(input.fbp), fbc = cookie(input.fbc);
  return { consent: true, policyVersion: "meta-v1", ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}
export function purchaseData(orderId, order) {
  if (order?.metaTracking?.consent !== true || order.metaTracking.policyVersion !== "meta-v1"
    || order.metaPaymentVerified !== true || !["APPROVED", "PAID", "SUCCESS"].includes(String(order.paymentStatus).toUpperCase())
    || order.inventoryStatus !== "committed" || !order.metaConfirmedAt) return null;
  const items = order.items || [];
  if (!items.length || items.some(item => !item.metaCatalogId || !Number.isInteger(item.quantity) || item.quantity <= 0 || !(item.price > 0))) return null;
  const value = Number(order.total);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(value) || value <= 0 || Math.abs(value - subtotal - Number(order.shipping || 0)) > 0.01) return null;
  return { eventId: `purchase:${orderId}`, data: { content_ids: items.map(item => item.metaCatalogId), content_type: "product", currency: "COP", value,
    num_items: items.reduce((sum, item) => sum + item.quantity, 0), contents: items.map(item => ({ id: item.metaCatalogId, quantity: item.quantity, item_price: item.price, color: item.color || "", size: item.size || "" })) } };
}
export function conversionEvent(orderId, order) {
  const purchase = purchaseData(orderId, order);
  const tracking = sanitizeTracking(order?.metaTracking, true);
  if (!purchase || (!tracking?.fbp && !tracking?.fbc)) return null;
  const milliseconds = order.metaConfirmedAt?.toMillis?.();
  if (!Number.isFinite(milliseconds)) return null;
  return { event_name: "Purchase", event_id: purchase.eventId, event_time: Math.floor(milliseconds / 1000), action_source: "website",
    event_source_url: "https://dleongold.com/checkout", user_data: { ...(tracking.fbp ? { fbp: tracking.fbp } : {}), ...(tracking.fbc ? { fbc: tracking.fbc } : {}) }, custom_data: purchase.data };
}
export async function sendConversion(event, { pixelId, token, version, testCode }, fetcher = fetch) {
  if (!/^\d+$/.test(pixelId || "") || !token || !/^v\d+\.\d+$/.test(version || "")) throw new Error("META_CONFIG_INVALID");
  try {
    const response = await fetcher(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
    });
    const body = await response.json();
    if (!response.ok || body.events_received !== 1) throw new Error("META_NOT_ACCEPTED");
  } catch {
    // Do not log response bodies, tokens, cookie IDs or the original exception.
    throw new Error("META_DELIVERY_FAILED");
  }
}
