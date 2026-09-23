import test from "node:test";
import assert from "node:assert/strict";
import admin from "firebase-admin";
import { prepareManagedProductPrices } from "./manageProducts.js";

test("creación y edición manual conservan exactamente los precios escritos", () => {
  assert.deepEqual(
    prepareManagedProductPrices({ sku: "TEST", price_cop: "110000", oldPrice: "135000" }),
    { sku: "TEST", price_cop: 110000, oldPrice: 135000 },
  );
  assert.deepEqual(
    prepareManagedProductPrices({ sku: "TEST", price_cop: "99000", oldPrice: "125000" }),
    { sku: "TEST", price_cop: 99000, oldPrice: 125000 },
  );
});

test("vaciar precio anterior produce una eliminación de campo", () => {
  const product = prepareManagedProductPrices({ sku: "TEST", price_cop: 110000, oldPrice: null });
  assert.equal(product.price_cop, 110000);
  assert.equal(product.oldPrice.isEqual(admin.firestore.FieldValue.delete()), true);
});

test("cliente anterior que no envía oldPrice no borra el campo existente", () => {
  const product = prepareManagedProductPrices({ sku: "TEST", price_cop: 110000 });
  assert.equal(Object.prototype.hasOwnProperty.call(product, "oldPrice"), false);
});

test("convierte y conserva precios manuales diferentes por talla", () => {
  const product = prepareManagedProductPrices({
    sku: "TEST",
    price_cop: 110000,
    variants: [{ color: "AZUL", tallas: [
      { size: "30", stock: 2, price_cop: "110000", oldPrice: "120000" },
      { size: "42", stock: 1, price_cop: "125000", oldPrice: "" },
    ] }],
  });
  assert.deepEqual(product.variants[0].tallas.map(({ price_cop, oldPrice }) => ({ price_cop, oldPrice })), [
    { price_cop: 110000, oldPrice: 120000 },
    { price_cop: 125000, oldPrice: null },
  ]);
});
