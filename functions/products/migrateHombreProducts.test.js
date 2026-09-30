import test from "node:test";
import assert from "node:assert/strict";
import { hombreDepartmentFor, migrateHombreFields, planHombreMigration } from "./migrateHombreProducts.js";

test("mueve Jeans y Pantalones a HOMBRE > JEANS y Capri a ROPA DEPORTIVA", () => {
  const plan = planHombreMigration([
    { id: "J1", path: "productos/ropa/items/J1", data: { category: "ROPA", department: "HOMBRE", subcategory: "JEANS URBANO" } },
    { id: "P1", path: "productos/ropa/items/P1", data: { category: "ROPA", department: "HOMBRE", subcategory: "PANTALON CARGO" } },
    { id: "C1", path: "productos/ropa/items/C1", data: { category: "ROPA", department: "HOMBRE", subcategory: "CAPRI" } },
    { id: "D1", path: "productos/ropa/items/D1", data: { category: "ROPA", department: "DAMA", subcategory: "JEANS" } },
  ]);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map(({ destinationPath }) => destinationPath), ["productos/hombre/items/J1", "productos/hombre/items/P1", "productos/hombre/items/C1"]);
  assert.deepEqual(plan.map(({ data }) => data.department), ["JEANS", "JEANS", "ROPA DEPORTIVA"]);
  assert.equal(hombreDepartmentFor({ subcategory: "CAMISETA" }), null);
});

test("la transformación conserva subcategoría, precios, variantes e inventario", () => {
  const source = { category: "ROPA", department: "HOMBRE", subcategory: "CAPRI", price_cop: 95000, variants: [{ color: "NEGRO", tallas: [{ size: "32", stock: 2 }] }] };
  const migrated = migrateHombreFields(source);
  assert.equal(migrated.category, "HOMBRE");
  assert.equal(migrated.department, "ROPA DEPORTIVA");
  assert.equal(migrated.subcategory, "CAPRI");
  assert.equal(migrated.price_cop, source.price_cop);
  assert.deepEqual(migrated.variants, source.variants);
});
