import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTracking, trackingEnabled, purchaseData, conversionEvent, sendConversion } from "./conversionsDomain.js";
import { deliverPurchase } from "./conversions.js";
const order = () => ({ paymentStatus: "APPROVED", inventoryStatus: "committed", metaPaymentVerified: true,
  metaConfirmedAt: { toMillis: () => Date.now() }, metaTracking: { consent: true, policyVersion: "meta-v1", fbp: "fb.1.1700000000000.123" },
  total: 140000, shipping: 10000, items: [{ metaCatalogId: "v:J-42", price: 130000, quantity: 1, color: "AZUL", size: "42" }],
  customer: { email: "never-send@example.com", document: "PRIVATE" } });
test("server tracking defaults off, emulators remain off even with flags", () => {
  assert.equal(trackingEnabled({}), false);
  assert.equal(trackingEnabled({ META_ENABLED: "true", META_CONSENT_READY: "true", FIRESTORE_EMULATOR_HOST: "localhost:8086" }), false);
  assert.equal(sanitizeTracking({ consent: true }), null);
});
test("only safe consented attribution is retained", () => {
  assert.deepEqual(sanitizeTracking({ ...order().metaTracking, email: "private", token: "secret" }, true), order().metaTracking);
  assert.equal(sanitizeTracking({ consent: false }, true), null);
});
test("Purchase requires verified committed payment and consent, never success-page visit", () => {
  for (const patch of [{ paymentStatus: "PENDING" }, { metaPaymentVerified: false }, { inventoryStatus: "pending_payment" }, { metaTracking: null }, { total: 1 }, { items: [] }]) {
    assert.equal(purchaseData("order1", { ...order(), ...patch }), null);
  }
  const p = purchaseData("order1", order()); assert.equal(p.eventId, "purchase:order1"); assert.equal(p.data.value, 140000); assert.equal(p.data.contents[0].item_price, 130000);
});
test("CAPI uses identical event id and omits customer data, requires attribution", () => {
  const event = conversionEvent("order1", order()); assert.equal(event.event_id, purchaseData("order1", order()).eventId);
  assert.doesNotMatch(JSON.stringify(event), /never-send|PRIVATE|email|document/);
  assert.equal(conversionEvent("order1", { ...order(), metaTracking: { consent: true, policyVersion: "meta-v1" } }), null);
});
test("transport keeps token out of URL and sanitizes failures", async () => {
  let request;
  await sendConversion(conversionEvent("o", order()), { pixelId: "123", token: "PRIVATE_TOKEN", version: "v99.0" }, async (url, init) => { request = { url, init }; return { ok: true, json: async () => ({ events_received: 1 }) }; });
  assert.doesNotMatch(request.url, /PRIVATE/); assert.equal(JSON.parse(request.init.body).data[0].event_name, "Purchase");
  await assert.rejects(sendConversion({}, { pixelId: "123", token: "PRIVATE_TOKEN", version: "v99.0" }, async () => { throw Error("PRIVATE_TOKEN"); }), { message: "META_DELIVERY_FAILED" });
});
function memoryDb(o) {
  const saved = {};
  const ref = path => ({ path, set: async data => { saved[path] = { ...saved[path], ...data }; } });
  return { saved, collection: name => ({ doc: id => ref(`${name}/${id}`) }), runTransaction: async fn => fn({
    get: async r => ({ data: () => r.path.startsWith("orders/") ? o : saved[r.path] }),
    set: (r, data) => { saved[r.path] = { ...saved[r.path], ...data }; },
  }) };
}
test("delivery is idempotent, retries reuse identity, disabled worker sends nothing", async () => {
  const database = memoryDb(order()); let calls = 0;
  const options = { database, enabled: true, send: async () => { calls++; if (calls === 1) throw Error("timeout"); } };
  assert.equal(await deliverPurchase("o", { ...options, enabled: false }), "disabled"); assert.equal(calls, 0);
  await assert.rejects(deliverPurchase("o", options), /META_DELIVERY_RETRY/);
  assert.equal(await deliverPurchase("o", options), "sent");
  assert.equal(await deliverPurchase("o", options), "skipped"); assert.equal(calls, 2);
});
