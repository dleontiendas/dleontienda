import {
  buildDamaDepartments,
  buildDamaSubcategoryGroups,
  isDamaProduct,
  normalizeDamaDepartment,
} from "./damaDepartment";

const product = (department, subcategory, extra = {}) => ({
  category: "Dama",
  catSlug: "dama",
  department,
  subcategory,
  ...extra,
});
const enrich = (items) => items.map((item) => ({ ...item, depSlug: normalizeDamaDepartment(item.department) }));

test("A: presenta los departamentos de Dama en el orden solicitado", () => {
  expect(buildDamaDepartments([]).map(({ key }) => key)).toEqual([
    "jeans", "ropa-deportiva", "blusas", "ropa-interior", "accesorios", "otros",
  ]);
});

test("B y C: genera Skinny y cualquier nueva subcategoría desde los productos", () => {
  const products = enrich([product("Jeans", "Skinny"), product("JEANS", "Nueva subcategoría")]);
  const departments = buildDamaDepartments(products);
  const jeans = buildDamaSubcategoryGroups(products, departments).find(({ key }) => key === "jeans");
  expect(jeans.subcats).toEqual(["Nueva subcategoría", "Skinny"]);
  expect(departments.find(({ key }) => key === "jeans").count).toBe(2);
});

test("no muestra Jeans como subcategoría redundante del departamento Jeans", () => {
  const products = enrich([
    product("Jeans", "JEANS"),
    product("Jeans", "JEANS BOTA RECTA"),
  ]);
  const departments = buildDamaDepartments(products);
  const jeans = buildDamaSubcategoryGroups(products, departments).find(({ key }) => key === "jeans");

  expect(jeans.subcats).toEqual(["JEANS BOTA RECTA"]);
  expect(departments.find(({ key }) => key === "jeans").count).toBe(2);
});

test("D: Cinturones aparece dentro de Accesorios", () => {
  const products = enrich([product("Accesorios", "Cinturones")]);
  const departments = buildDamaDepartments(products);
  expect(buildDamaSubcategoryGroups(products, departments).find(({ key }) => key === "accesorios").subcats).toEqual(["Cinturones"]);
});

test("E: departamentos futuros son dinámicos y Otros permanece al final", () => {
  const departments = buildDamaDepartments(enrich([product("Vestidos", "Largos"), product("Otros", "Varios")]));
  expect(departments.map(({ key }) => key)).toEqual([
    "jeans", "ropa-deportiva", "blusas", "ropa-interior", "accesorios", "vestidos", "otros",
  ]);
});

test("acepta productos Dama nuevos y productos DAMA heredados de ROPA durante la migración", () => {
  expect(isDamaProduct(product("Jeans", "Skinny"))).toBe(true);
  expect(isDamaProduct({ category: "ROPA", catSlug: "ropa", department: "DAMA", subcategory: "JEANS PEDRERIA" })).toBe(true);
  expect(isDamaProduct({ category: "ROPA", catSlug: "ropa", department: "HOMBRE", subcategory: "JEANS" })).toBe(false);
});
