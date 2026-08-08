import test from "node:test";
import assert from "node:assert/strict";
import { changeItemStock, findSizeLocation, transitionInventoryStatus } from "./inventoryDomain.js";

const product = (stock = 2) => ({
  variants: [
    { color: "AZUL", tallas: [{ size: "32", stock, sku_master: "BIXLER-584-AZUL-32" }] },
    { color: "NEGRO", tallas: [{ size: "32", stock: 9, sku_master: "BIXLER-584-NEGRO-32" }] },
  ],
});

test("identifica la variante exacta por SKU Maestro", () => {
  assert.deepEqual(findSizeLocation(product(), { skuMaster: "BIXLER-584-AZUL-32" }), { variantIndex: 0, sizeIndex: 0 });
});

test("mantiene compatibilidad legacy por color y talla", () => {
  assert.deepEqual(findSizeLocation(product(), { color: "NEGRO", size: "32" }), { variantIndex: 1, sizeIndex: 0 });
});

test("reserva la cantidad comprada sin modificar otra variante", () => {
  const changed = changeItemStock(product(3), { skuMaster: "BIXLER-584-AZUL-32", quantity: 2 }, -1);
  assert.equal(changed.variants[0].tallas[0].stock, 1);
  assert.equal(changed.variants[1].tallas[0].stock, 9);
});

test("rechaza inventario insuficiente", () => {
  assert.throws(() => changeItemStock(product(1), { skuMaster: "BIXLER-584-AZUL-32", quantity: 2 }, -1), /INSUFFICIENT_STOCK/);
});

test("webhook aprobado repetido no vuelve a cambiar stock", () => {
  assert.deepEqual(transitionInventoryStatus("committed", "APPROVED"), { next: "committed", stockDelta: 0 });
});

test("cancelación libera una sola vez", () => {
  assert.deepEqual(transitionInventoryStatus("reserved", "CANCELLED"), { next: "released", stockDelta: 1 });
  assert.deepEqual(transitionInventoryStatus("released", "CANCELLED"), { next: "released", stockDelta: 0 });
});

test("una aprobación tardía vuelve a descontar después de liberar", () => {
  assert.deepEqual(transitionInventoryStatus("released", "APPROVED"), { next: "committed", stockDelta: -1 });
});

test("un rechazo tardío no libera una venta ya confirmada", () => {
  assert.deepEqual(transitionInventoryStatus("committed", "REJECTED"), { next: "committed", stockDelta: 0 });
});

test("un reembolso sí devuelve inventario confirmado", () => {
  assert.deepEqual(transitionInventoryStatus("committed", "REFUNDED"), { next: "released", stockDelta: 1 });
});

test("dos compras por la última unidad no pueden completarse secuencialmente", () => {
  const first = changeItemStock(product(1), { skuMaster: "BIXLER-584-AZUL-32", quantity: 1 }, -1);
  assert.equal(first.variants[0].tallas[0].stock, 0);
  assert.throws(() => changeItemStock(first, { skuMaster: "BIXLER-584-AZUL-32", quantity: 1 }, -1), /INSUFFICIENT_STOCK/);
});
