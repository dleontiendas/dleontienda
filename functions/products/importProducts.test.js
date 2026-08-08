import test from "node:test";
import assert from "node:assert/strict";
import { mergeImportedProduct } from "./importProducts.js";

const incoming = (overrides = {}) => ({
  sku: "CKG0002",
  name: "Pijama actualizada",
  category: "ROPA",
  images: [],
  variants: [{
    color: "SONIC",
    images: [],
    tallas: [{ size: "4", stock: 5, sku_master: "COOLKIDS-CKG0002-SONIC-4", update_inventory: false }],
  }],
  ...overrides,
});

const existing = (stock = 2) => ({
  sku: "CKG0002",
  name: "Pijama",
  active: true,
  variants: [{ color: "SONIC", images: [], tallas: [{ size: "4", stock, sku_master: "COOLKIDS-CKG0002-SONIC-4" }] }],
});

test("producto nuevo usa cantidad inicial aunque Actualizar inventario sea NO", () => {
  assert.equal(mergeImportedProduct(null, incoming()).variants[0].tallas[0].stock, 5);
});

test("producto existente actualiza datos por referencia base", () => {
  assert.equal(mergeImportedProduct(existing(), incoming()).name, "Pijama actualizada");
});

test("inventario NO conserva la existencia almacenada", () => {
  assert.equal(mergeImportedProduct(existing(2), incoming()).variants[0].tallas[0].stock, 2);
});

test("inventario SÍ reemplaza la existencia almacenada", () => {
  const product = incoming();
  product.variants[0].tallas[0].update_inventory = true;
  assert.equal(mergeImportedProduct(existing(2), product).variants[0].tallas[0].stock, 5);
});

test("adopta SKU Maestro en una variante legacy sin duplicarla", () => {
  const legacy = existing(3);
  delete legacy.variants[0].tallas[0].sku_master;
  const merged = mergeImportedProduct(legacy, incoming());
  assert.equal(merged.variants[0].tallas.length, 1);
  assert.equal(merged.variants[0].tallas[0].sku_master, "COOLKIDS-CKG0002-SONIC-4");
  assert.equal(merged.variants[0].tallas[0].stock, 3);
});

test("localiza el SKU Maestro aunque el color haya cambiado y no duplica la variante", () => {
  const current = existing(3);
  const changed = incoming();
  changed.variants[0].color = "SONIC NUEVO";
  const merged = mergeImportedProduct(current, changed);
  const sizes = merged.variants.flatMap((variant) => variant.tallas);
  assert.equal(sizes.filter((size) => size.sku_master === "COOLKIDS-CKG0002-SONIC-4").length, 1);
  assert.equal(merged.variants.find((variant) => variant.color === "SONIC NUEVO").tallas[0].stock, 3);
});
