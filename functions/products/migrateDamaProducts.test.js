import test from "node:test";
import assert from "node:assert/strict";
import { migrateDamaFields, planDamaMigration } from "./migrateDamaProducts.js";

test("mueve solo ROPA > DAMA a DAMA > JEANS y conserva la subcategoría", () => {
  const plan = planDamaMigration([
    { id: "D1", path: "productos/ropa/items/D1", data: { category: "ROPA", department: "DAMA", subcategory: "JEANS SKINNY" } },
    { id: "H1", path: "productos/ropa/items/H1", data: { category: "ROPA", department: "HOMBRE", subcategory: "JEANS" } },
  ]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].destinationPath, "productos/dama/items/D1");
  assert.equal(plan[0].data.category, "DAMA");
  assert.equal(plan[0].data.department, "JEANS");
  assert.equal(plan[0].data.subcategory, "JEANS SKINNY");
});

test("la transformación no altera precios, variantes ni inventario", () => {
  const source = { category: "ROPA", department: "DAMA", subcategory: "JEANS", price_cop: 120000, variants: [{ color: "AZUL", tallas: [{ size: "10", stock: 3 }] }] };
  const migrated = migrateDamaFields(source);
  assert.equal(migrated.price_cop, source.price_cop);
  assert.deepEqual(migrated.variants, source.variants);
});
