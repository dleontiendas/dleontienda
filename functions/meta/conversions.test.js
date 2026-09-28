import test from "node:test";
import assert from "node:assert/strict";
import { orderCommerceData, purchaseData, sanitizeTracking } from "./conversionsDomain.js";

const items = [{ metaCatalogId: "v:J-42", price: 130000, quantity: 1 }];
const order = () => ({
  paymentStatus: "APPROVED", inventoryStatus: "committed", metaPaymentVerified: true,
  metaConfirmedAt: { toMillis: () => Date.now() },
  metaTracking: { consent: true, policyVersion: "meta-v1", fbp: "fb.1.1700000000000.123" },
  total: 140000, shipping: 10000, items,
});

test("only consented attribution cookies are retained", () => {
  assert.deepEqual(sanitizeTracking({ ...order().metaTracking, email: "private", token: "secret" }), order().metaTracking);
  assert.equal(sanitizeTracking({ consent: false }), null);
});

test("keeps consultable consent version and timestamp without accepting arbitrary fields", () => {
  const tracked = sanitizeTracking({
    consent: true,
    policyVersion: "meta-v1",
    consentVersion: "2026-09-27",
    consentAt: "2026-09-27T18:00:00.000Z",
    privateValue: "discard",
  });
  assert.deepEqual(tracked, {
    consent: true,
    policyVersion: "meta-v1",
    consentVersion: "2026-09-27",
    consentAt: "2026-09-27T18:00:00.000Z",
  });
});

test("commerce data uses catalog IDs and authoritative totals", () => {
  assert.deepEqual(orderCommerceData("o", items, 140000, "WOMPI"), {
    order_id: "o", content_ids: ["v:J-42"], content_type: "product", currency: "COP", value: 140000,
    num_items: 1, contents: [{ id: "v:J-42", quantity: 1, item_price: 130000 }], payment_method: "WOMPI",
  });
});

test("Purchase requires consent and a verified committed payment", () => {
  for (const patch of [{ paymentStatus: "PENDING" }, { metaPaymentVerified: false }, { inventoryStatus: "pending_payment" }, { metaTracking: null }, { total: 1 }, { items: [] }]) {
    assert.equal(purchaseData("order1", { ...order(), ...patch }), null);
  }
  const purchase = purchaseData("order1", order());
  assert.equal(purchase.eventId, "purchase:order1");
  assert.equal(purchase.data.order_id, "order1");
  assert.deepEqual(purchase.data.content_ids, ["v:J-42"]);
});
