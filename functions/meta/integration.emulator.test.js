import test, { after } from "node:test";
import assert from "node:assert/strict";
import admin, { db } from "../firebasebaseAdmin.js";
import { createOrderWithReservationHandler } from "../orders/createOrder.js";
import { getOrderStatusHandler } from "../orders/readOrders.js";
import { deliverPurchase } from "./conversions.js";
if (!process.env.FIRESTORE_EMULATOR_HOST || (process.env.GCLOUD_PROJECT || "") !== "demo-dleon") throw new Error("Isolated demo emulator required");
after(() => admin.app().delete());
test("real Firestore transaction preserves token, resolves plus price, and never tracks without consent", async () => {
  const ref = db.doc("productos/ropa/items/META-TEST");
  await ref.set({ sku: "META-TEST", name: "Fixture", price_cop: 100000, variants: [{ color: "AZUL", tallas: [{ size: "42", stock: 3, price_cop: 130000, sku_master: "META-PLUS" }] }] });
  const created = await createOrderWithReservationHandler({ data: { shipping: 10000, paymentProvider: "WOMPI", items: [{ productId: "META-TEST", catSlug: "ropa", color: "AZUL", size: "42", quantity: 1 }], metaTracking: { consent: true, policyVersion: "meta-v1" } } });
  assert.equal(created.accessToken.length, 64);
  const status = await getOrderStatusHandler({ data: { orderId: created.orderId, accessToken: created.accessToken } });
  assert.equal(status.total, 140000); assert.equal(status.metaPurchase, null);
  await assert.rejects(getOrderStatusHandler({ data: { orderId: created.orderId, accessToken: "wrong" } }));
  const saved = (await db.collection("orders").doc(created.orderId).get()).data();
  assert.equal(saved.metaTracking, null); assert.equal(saved.items[0].metaCatalogId, "v:META-PLUS");
  assert.equal(saved.accessToken, undefined);
});
test("concurrent conversion deliveries send once and skip already delivered order", async () => {
  const id = `meta-concurrent-${Date.now()}`;
  await db.collection("orders").doc(id).set({ paymentStatus: "APPROVED", inventoryStatus: "committed", metaPaymentVerified: true,
    metaConfirmedAt: admin.firestore.Timestamp.now(), metaTracking: { consent: true, policyVersion: "meta-v1", fbp: "fb.1.1700000000000.123" },
    total: 130000, shipping: 0, items: [{ metaCatalogId: "v:META-PLUS", price: 130000, quantity: 1 }] });
  let calls = 0;
  const options = { database: db, enabled: true, send: async () => { calls++; } };
  await Promise.allSettled([deliverPurchase(id, options), deliverPurchase(id, options)]);
  assert.equal(await deliverPurchase(id, options), "skipped"); assert.equal(calls, 1);
});
