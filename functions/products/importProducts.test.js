import test from "node:test";
import assert from "node:assert/strict";
import { mergeImportedProduct } from "./importProducts.js";

test("crea y actualiza ambos precios numéricos sin duplicar SKU maestro", () => {
  const created = mergeImportedProduct(null, incoming({ price_cop: "110000", oldPrice: "120000" }));
  assert.equal(created.price_cop, 110000);
  assert.equal(created.oldPrice, 120000);
  const updated = mergeImportedProduct(created, incoming({ price_cop: 100000, oldPrice: 110000 }));
  assert.equal(updated.price_cop, 100000);
  assert.equal(updated.oldPrice, 110000);
  assert.equal(updated.variants[0].tallas.length, 1);
});

test("precio anterior vacío limpia el dato y cliente antiguo conserva el dato existente", () => {
  const current = { ...existing(), oldPrice: 120000 };
  assert.equal(mergeImportedProduct(current, incoming({ oldPrice: null })).oldPrice, null);
  assert.equal(mergeImportedProduct(null, incoming({ oldPrice: null })).oldPrice, null);
  assert.equal(mergeImportedProduct(current, incoming()).oldPrice, 120000);
});

test("permite precio anterior menor o igual y rechaza importes inválidos en servidor", () => {
  for (const oldPrice of [100000, 110000]) assert.equal(mergeImportedProduct(null, incoming({ oldPrice })).oldPrice, oldPrice);
  for (const value of [0, -1, Infinity, "abc", "$120.000", true]) {
    assert.throws(() => mergeImportedProduct(null, incoming({ price_cop: value })));
    assert.throws(() => mergeImportedProduct(null, incoming({ oldPrice: value })));
  }
});

const incoming = (overrides = {}) => ({
  sku: "CKG0002",
  name: "Pijama actualizada",
  category: "ROPA",
  price_cop: 110000,
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

test("reemplaza las imágenes anteriores de la variante del mismo color", () => {
  const current = existing(3);
  current.variants[0].images = ["anterior.jpg"];
  const changed = incoming();
  changed.variants[0].color = " sonic ";
  changed.variants[0].images = ["nueva-1.jpg", "nueva-2.jpg"];
  const merged = mergeImportedProduct(current, changed);
  assert.equal(merged.variants.length, 1);
  assert.deepEqual(merged.variants[0].images, ["nueva-1.jpg", "nueva-2.jpg"]);
  assert.deepEqual(current.variants[0].images, ["anterior.jpg"]);
});

test("reemplaza la galería principal y elimina duplicados respetando la nueva principal", () => {
  const current = { ...existing(), images: ["principal-anterior.jpg", "extra-anterior.jpg"] };
  const changed = incoming({ images: ["principal-nueva.jpg", "extra-nueva.jpg", "principal-nueva.jpg"] });
  const merged = mergeImportedProduct(current, changed);
  assert.deepEqual(merged.images, ["principal-nueva.jpg", "extra-nueva.jpg"]);
  assert.deepEqual(mergeImportedProduct(merged, changed).images, merged.images);
  assert.deepEqual(current.images, ["principal-anterior.jpg", "extra-anterior.jpg"]);
});

test("las celdas vacías o ausentes conservan las imágenes actuales", () => {
  for (const images of [[], undefined, [null, ""]]) {
    const current = { ...existing(), images: ["principal.jpg"] };
    current.variants[0].images = ["color.jpg"];
    const changed = incoming({ images });
    changed.variants[0].images = images;
    const merged = mergeImportedProduct(current, changed);
    assert.deepEqual(merged.images, ["principal.jpg"]);
    assert.deepEqual(merged.variants[0].images, ["color.jpg"]);
  }
});

test("reemplaza principal y color juntos conservando las imágenes de otros colores", () => {
  const current = { ...existing(), images: ["principal-anterior.jpg"] };
  current.variants[0].images = ["sonic-anterior.jpg"];
  current.variants.push({ color: "ROJO", images: ["rojo.jpg"], tallas: [] });
  const changed = incoming({ images: ["principal-nueva.jpg"] });
  changed.variants[0].images = ["sonic-nueva.jpg"];
  const merged = mergeImportedProduct(current, changed);
  assert.deepEqual(merged.images, ["principal-nueva.jpg"]);
  assert.deepEqual(merged.variants[0].images, ["sonic-nueva.jpg"]);
  assert.deepEqual(merged.variants[1].images, ["rojo.jpg"]);
});

test("asigna imágenes a una variante nueva sin mezclarlas con otros colores", () => {
  const changed = incoming({
    variants: [{
      color: "ROJO",
      images: ["rojo.jpg"],
      tallas: [{ size: "ÚNICA", stock: 1, sku_master: "COOLKIDS-CKG0002-ROJO-UNICA", update_inventory: false }],
    }],
  });
  const merged = mergeImportedProduct(existing(3), changed);
  assert.deepEqual(merged.variants.find((variant) => variant.color === "ROJO").images, ["rojo.jpg"]);
  assert.deepEqual(merged.variants.find((variant) => variant.color === "SONIC").images, []);
});
