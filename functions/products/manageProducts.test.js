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
