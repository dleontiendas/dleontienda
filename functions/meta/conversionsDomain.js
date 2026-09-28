export function sanitizeTracking(input) {
  if (input?.consent !== true || input.policyVersion !== "meta-v1") return null;
  const cookie = value => typeof value === "string" && /^fb\.\d\.\d{10,13}\.[A-Za-z0-9._-]{1,300}$/.test(value) ? value : null;
  const fbp = cookie(input.fbp), fbc = cookie(input.fbc);
  const consentAt = typeof input.consentAt === "string" && !Number.isNaN(Date.parse(input.consentAt)) ? input.consentAt : null;
  const consentVersion = typeof input.consentVersion === "string" && /^[A-Za-z0-9._-]{1,40}$/.test(input.consentVersion) ? input.consentVersion : null;
  return {
    consent: true,
    policyVersion: "meta-v1",
    ...(consentVersion ? { consentVersion } : {}),
    ...(consentAt ? { consentAt } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };
}
export function orderCommerceData(orderId, items, value, paymentMethod) {
  if (!orderId || !Array.isArray(items) || !items.length
    || items.some(item => !item.metaCatalogId || !Number.isInteger(item.quantity) || item.quantity <= 0 || !(item.price > 0))
    || !Number.isFinite(Number(value)) || Number(value) <= 0) return null;
  return {
    order_id: orderId,
    content_ids: items.map(item => item.metaCatalogId),
    content_type: "product",
    currency: "COP",
    value: Number(value),
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    contents: items.map(item => ({ id: item.metaCatalogId, quantity: item.quantity, item_price: item.price })),
    ...(paymentMethod ? { payment_method: String(paymentMethod) } : {}),
  };
}
export function purchaseData(orderId, order) {
  if (order?.metaTracking?.consent !== true || order.metaTracking.policyVersion !== "meta-v1"
    || order.metaPaymentVerified !== true || !["APPROVED", "PAID", "SUCCESS"].includes(String(order.paymentStatus).toUpperCase())
    || order.inventoryStatus !== "committed" || !order.metaConfirmedAt) return null;
  const items = order.items || [];
  const value = Number(order.total);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(value) || value <= 0 || Math.abs(value - subtotal - Number(order.shipping || 0)) > 0.01) return null;
  const data = orderCommerceData(orderId, items, value);
  return data ? { eventId: `purchase:${orderId}`, data } : null;
}
