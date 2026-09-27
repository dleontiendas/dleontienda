import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCatalog, catalogXml, publicImage } from "./catalog.js";
import { checkPublicImage, validateCatalogImages } from "./feed.js";
import contract from "./catalogContract.cjs";
const product = () => ({ id: "JEAN1", sku: "JEAN1", catSlug: "ropa", name: "Jean D'LEON & niña", description: '<b>Algodón</b> "azul"', price_cop: 115000, images: ["https://dleongold.com/jean.jpg"], variants: [{ color: "AZUL", tallas: [{ size: "10", stock: 2, sku_master: "J-10" }, { size: "42", stock: 1, sku_master: "J-42", price_cop: 130000 }] }] });
test("frontend and deployable backend use exactly the same identity contract", () => {
  assert.equal(fs.readFileSync(new URL("../../src/meta/catalogContract.js", import.meta.url), "utf8"), fs.readFileSync(new URL("./catalogContract.cjs", import.meta.url), "utf8"));
});
test("prices inherit correctly, plus price is independent and URL selects exact SKU", () => {
  const p = product(), { rows } = buildCatalog([p]);
  assert.equal(rows[0].price, "115000 COP"); assert.equal(rows[1].price, "130000 COP");
  assert.equal(rows[0].item_group_id, rows[1].item_group_id);
  for (const row of rows) {
    const id = new URL(row.link).searchParams.get("variant");
    assert.equal(contract.selectCatalogVariant(p, id).size.sku_master, row.mpn);
    assert.equal(contract.commerceItem(p, row.color, row.size).id, row.id);
  }
});
test("uniform prices, exhausted variants, discount and explicit null discount", () => {
  const p = product(); p.oldPrice = 150000;
  p.variants[0].tallas[1] = { size: "42", stock: 0, price_cop: 115000, oldPrice: null };
  const { rows } = buildCatalog([p]);
  assert.equal(rows.find(r => r.size === "10").sale_price, "115000 COP");
  assert.equal(rows.find(r => r.size === "10").price, "150000 COP");
  const out = rows.find(r => r.size === "42");
  assert.equal(out.availability, "out of stock"); assert.equal(out.price, "115000 COP"); assert.equal(out.sale_price, undefined);
});
test("IDs stable after price changes/reordering; legacy colors remain distinct", () => {
  const p = product(); delete p.variants[0].tallas[0].sku_master;
  const ids = buildCatalog([p]).rows.map(r => r.id);
  p.price_cop = 99000; p.variants[0].tallas.reverse();
  assert.deepEqual(buildCatalog([p]).rows.map(r => r.id), ids);
  p.variants.push({ color: "NEGRO", tallas: [{ size: "10", stock: 2 }] });
  assert.equal(new Set(buildCatalog([p]).rows.map(r => r.id)).size, 3);
});
test("reject duplicate product references, duplicate variant IDs and missing information", () => {
  const p = product(); assert.equal(buildCatalog([p, { ...p, catSlug: "otra" }]).rows.length, 0);
  p.variants[0].tallas[1].sku_master = "J-10";
  assert.equal(buildCatalog([p]).rows.length, 0);
  for (const patch of [{ name: "" }, { description: "" }, { images: [] }, { active: false }]) assert.equal(buildCatalog([{ ...product(), ...patch }]).rows.length, 0);
});
test("XML escapes punctuation and accents without HTML", () => {
  const xml = catalogXml(buildCatalog([product()]).rows);
  assert.match(xml, /D&apos;LEON &amp; niña/); assert.match(xml, /Algodón &quot;azul&quot;/); assert.doesNotMatch(xml, /<b>/);
});
test("HTTPS image allowlist blocks private hosts, credentials and misleading domains", () => {
  for (const url of ["http://dleongold.com/a", "https://127.0.0.1/a", "https://dleongold.com.evil.test/a", "https://user:pass@dleongold.com/a"]) assert.equal(publicImage(url), null);
  assert.equal(publicImage("https://drive.google.com/file/d/abc_123/view"), "https://lh3.googleusercontent.com/d/abc_123=w1200");
});
test("image probe rejects login pages, broken images and private redirects", async () => {
  const fake = (status, mime, location) => async () => ({ status, ok: status === 200, headers: new Headers({ "content-type": mime, ...(location ? { location } : {}) }) });
  assert.equal(await checkPublicImage("https://dleongold.com/a.jpg", fake(200, "image/jpeg")), true);
  assert.equal(await checkPublicImage("https://dleongold.com/a.jpg", fake(200, "text/html")), false);
  assert.equal(await checkPublicImage("https://dleongold.com/a.jpg", fake(404, "image/jpeg")), false);
  assert.equal(await checkPublicImage("https://dleongold.com/a.jpg", fake(302, "text/html", "http://127.0.0.1/secret")), false);
});
test("rows with unreachable images are excluded", async () => {
  assert.equal((await validateCatalogImages(buildCatalog([product()]).rows, async () => false)).length, 0);
});
