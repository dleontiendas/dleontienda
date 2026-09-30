import {
  buildHombreDepartments,
  buildHombreSubcategoryGroups,
  isHombreProduct,
  legacyHombreDepartment,
  normalizeHombreDepartment,
} from "./hombreDepartment";

const product = (department, subcategory) => ({ category: "Hombre", catSlug: "hombre", department, subcategory });
const enrich = items => items.map(item => ({ ...item, depSlug: normalizeHombreDepartment(item.department) }));

test("presenta los departamentos de Hombre en el orden solicitado y Otros al final", () => {
  expect(buildHombreDepartments([]).map(({ key }) => key)).toEqual(["jeans", "camisetas", "ropa-deportiva", "ropa-interior", "accesorios", "otros"]);
  const departments = buildHombreDepartments(enrich([product("Zapatos", "Casuales"), product("Otros", "Varios")]));
  expect(departments.at(-1).key).toBe("otros");
});

test("genera subcategorías dinámicas únicamente desde productos reales", () => {
  const products = enrich([product("Jeans", "Jeans urbano"), product("Jeans", "Pantalón cargo"), product("Accesorios", "Cinturones")]);
  const groups = buildHombreSubcategoryGroups(products, buildHombreDepartments(products));
  expect(groups.find(({ key }) => key === "jeans").subcats).toEqual(["Jeans urbano", "Pantalón cargo"]);
  expect(groups.find(({ key }) => key === "accesorios").subcats).toEqual(["Cinturones"]);
});

test("clasifica el legado Jeans y Pantalones en Jeans, y Capri en Ropa deportiva", () => {
  expect(legacyHombreDepartment({ subcategory: "JEANS URBANO" })).toBe("jeans");
  expect(legacyHombreDepartment({ subcategory: "PANTALON CARGO" })).toBe("jeans");
  expect(legacyHombreDepartment({ subcategory: "CAPRI" })).toBe("ropa-deportiva");
  expect(isHombreProduct({ category: "ROPA", department: "HOMBRE", subcategory: "JEANS" })).toBe(true);
  expect(isHombreProduct({ category: "DAMA", department: "JEANS", subcategory: "SKINNY" })).toBe(false);
});
