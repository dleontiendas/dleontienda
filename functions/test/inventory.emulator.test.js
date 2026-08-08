import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import admin, { db } from "../firebasebaseAdmin.js";
import { createOrderWithReservationHandler } from "../orders/createOrder.js";
import { applyPaymentStatus } from "../orders/inventoryService.js";
import { releaseExpiredReservations } from "../orders/expireReservations.js";
import { importProductsHandler } from "../products/importProducts.js";
import { manageProductHandler } from "../products/manageProducts.js";
import { getOrderStatusHandler, listOrdersHandler } from "../orders/readOrders.js";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Estas pruebas solo pueden ejecutarse con FIRESTORE_EMULATOR_HOST configurado.");
}

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "demo-dleon";
const emulatorOrigin = `http://${process.env.FIRESTORE_EMULATOR_HOST}`;
const productRef = () => db.collection("productos").doc("ropa").collection("items").doc("CKG0002");

async function clearFirestore() {
  const response = await fetch(`${emulatorOrigin}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: "DELETE" });
  if (!response.ok) throw new Error(`No se pudo limpiar Firestore Emulator: ${response.status}`);
}

async function seedProduct(stock = 5) {
  await productRef().set({
    sku: "CKG0002",
    name: "Pijama de prueba",
    category: "ROPA",
    price_cop: 36000,
    active: true,
    variants: [{
      color: "SONIC",
      images: [],
      tallas: [{ size: "4", stock, sku_master: "COOLKIDS-CKG0002-SONIC-4" }],
    }],
  });
}

function orderRequest(quantity = 1, provider = "WOMPI") {
  return {
    data: {
      customer: { email: "prueba@example.com", first_name: "Cliente" },
      shippingAddress: { address: "Calle de prueba", city: "Bogotá" },
      shipping: 25000,
      paymentMethod: provider.toLowerCase(),
      paymentProvider: provider,
      items: [{
        productId: "CKG0002",
        catSlug: "ropa",
        skuMaster: "COOLKIDS-CKG0002-SONIC-4",
        color: "SONIC",
        size: "4",
        quantity,
      }],
    },
    auth: null,
  };
}

async function stock() {
  return (await productRef().get()).data().variants[0].tallas[0].stock;
}

beforeEach(clearFirestore);
after(async () => {
  await clearFirestore();
  await admin.app().delete();
});

test("importador crea, conserva con NO y actualiza con SÍ", async () => {
  await db.collection("users").doc("admin-test").set({ uid: "admin-test", role: "admin", active: true });
  const product = {
    sku: "CKG0002",
    name: "Pijama de prueba",
    category: "ROPA",
    images: [],
    variants: [{ color: "SONIC", images: [], tallas: [{
      size: "4", stock: 5, sku_master: "COOLKIDS-CKG0002-SONIC-4", update_inventory: false, source_row: 2,
    }] }],
  };
  const created = await importProductsHandler({ auth: { uid: "admin-test" }, data: { products: [product] } });
  assert.deepEqual(created, { success: true, created: 1, updated: 0, total: 1 });
  assert.equal(await stock(), 5);

  product.variants[0].tallas[0].stock = 99;
  const preserved = await importProductsHandler({ auth: { uid: "admin-test" }, data: { products: [product] } });
  assert.equal(preserved.updated, 1);
  assert.equal(await stock(), 5);

  product.variants[0].tallas[0].update_inventory = true;
  const updated = await importProductsHandler({ auth: { uid: "admin-test" }, data: { products: [product] } });
  assert.equal(updated.updated, 1);
  assert.equal(await stock(), 99);
});

test("Functions administrativas rechazan clientes y aceptan administradores", async () => {
  await db.collection("users").doc("admin-test").set({ uid: "admin-test", role: "admin", active: true });
  await db.collection("users").doc("customer-test").set({ uid: "customer-test", role: "customer", active: true });
  await assert.rejects(
    () => manageProductHandler({ auth: { uid: "customer-test", token: {} }, data: { action: "toggle", path: "productos/ropa/items/CKG0002", active: false } }),
    /administrador/i,
  );
  const managed = await manageProductHandler({
    auth: { uid: "admin-test", token: {} },
    data: { action: "save", product: { sku: "ADMIN1", name: "Producto admin", category: "ROPA", variants: [] } },
  });
  assert.equal(managed.success, true);
  await assert.rejects(() => listOrdersHandler({ auth: { uid: "customer-test", token: {} }, data: {} }), /administrador/i);
  assert.deepEqual(await listOrdersHandler({ auth: { uid: "admin-test", token: {} }, data: {} }), { orders: [] });
});

test("estado público de la orden exige el token secreto correcto", async () => {
  await seedProduct(2);
  const created = await createOrderWithReservationHandler(orderRequest(1));
  await assert.rejects(
    () => getOrderStatusHandler({ data: { orderId: created.orderId, accessToken: "incorrecto" } }),
    /Token de orden inválido/i,
  );
  const visible = await getOrderStatusHandler({ data: { orderId: created.orderId, accessToken: created.accessToken } });
  assert.equal(visible.id, created.orderId);
  assert.equal(visible.paymentStatus, "PENDING");
  assert.equal("customer" in visible, false);
});

test("solo la compra aprobada descuenta y el webhook duplicado es idempotente", async () => {
  await seedProduct(5);
  const { orderId } = await createOrderWithReservationHandler(orderRequest(2));
  assert.equal(await stock(), 5);
  const first = await applyPaymentStatus({ orderId, status: "APPROVED", provider: "WOMPI", eventId: "evt-approved" });
  const repeated = await applyPaymentStatus({ orderId, status: "APPROVED", provider: "WOMPI", eventId: "evt-approved" });
  assert.equal(first.inventoryStatus, "committed");
  assert.equal(repeated.stockChanged, false);
  assert.equal(await stock(), 3);
});

test("pago rechazado no modifica inventario", async () => {
  await seedProduct(5);
  const { orderId } = await createOrderWithReservationHandler(orderRequest(2));
  assert.equal(await stock(), 5);
  await applyPaymentStatus({ orderId, status: "REJECTED", provider: "WOMPI", eventId: "evt-rejected" });
  assert.equal(await stock(), 5);
});

test("un webhook no puede confirmar una orden de otra pasarela ni con otro monto", async () => {
  await seedProduct(5);
  const { orderId } = await createOrderWithReservationHandler(orderRequest(1, "WOMPI"));
  assert.equal(await stock(), 5);
  await assert.rejects(
    () => applyPaymentStatus({ orderId, status: "APPROVED", provider: "BOLD", eventId: "wrong-provider" }),
    /PAYMENT_PROVIDER_MISMATCH/,
  );
  await assert.rejects(
    () => applyPaymentStatus({ orderId, status: "APPROVED", provider: "WOMPI", eventId: "wrong-amount", expectedTotal: 1 }),
    /PAYMENT_AMOUNT_MISMATCH/,
  );
  const order = (await db.collection("orders").doc(orderId).get()).data();
  assert.equal(order.inventoryStatus, "pending_payment");
  assert.equal(order.paymentStatus, "PENDING");
  assert.equal(await stock(), 5);
});

test("reserva abandonada vencida se libera automáticamente", async () => {
  await seedProduct(5);
  const { orderId } = await createOrderWithReservationHandler(orderRequest(1));
  await db.collection("orders").doc(orderId).update({ reservationExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() - 1000) });
  const result = await releaseExpiredReservations();
  assert.equal(result.released, 0);
  assert.equal(await stock(), 5);
});

test("dos clientes compitiendo por la última unidad no producen sobreventa", async () => {
  await seedProduct(1);
  const orders = await Promise.all([
    createOrderWithReservationHandler(orderRequest(1)),
    createOrderWithReservationHandler(orderRequest(1)),
  ]);
  assert.equal(await stock(), 1);
  const results = await Promise.allSettled(orders.map(({ orderId }, index) => applyPaymentStatus({
    orderId,
    status: "APPROVED",
    provider: "WOMPI",
    eventId: `concurrent-${index}`,
  })));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal(await stock(), 0);
});

test("cancelación y reembolso devuelven inventario una sola vez", async () => {
  await seedProduct(5);
  const firstOrder = await createOrderWithReservationHandler(orderRequest(2));
  await applyPaymentStatus({ orderId: firstOrder.orderId, status: "APPROVED", provider: "WOMPI", eventId: "sale-1" });
  await applyPaymentStatus({ orderId: firstOrder.orderId, status: "CANCELLED", provider: "WOMPI", eventId: "cancel-1" });
  await applyPaymentStatus({ orderId: firstOrder.orderId, status: "CANCELLED", provider: "WOMPI", eventId: "cancel-1" });
  assert.equal(await stock(), 5);

  const secondOrder = await createOrderWithReservationHandler(orderRequest(1));
  await applyPaymentStatus({ orderId: secondOrder.orderId, status: "APPROVED", provider: "WOMPI", eventId: "sale-2" });
  await applyPaymentStatus({ orderId: secondOrder.orderId, status: "REFUNDED", provider: "WOMPI", eventId: "refund-2" });
  await applyPaymentStatus({ orderId: secondOrder.orderId, status: "REFUNDED", provider: "WOMPI", eventId: "refund-2" });
  assert.equal(await stock(), 5);
});
