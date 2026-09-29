import {
  buildTechnologyDepartments,
  buildTechnologySubcategoryGroups,
  isTechnologyProduct,
  normalizeTechnologyDepartment,
} from "./technologyDepartment";

const product = (department, subcategory, extra = {}) => ({
  category: "Tecnología",
  catSlug: "tecnologia",
  department,
  subcategory,
  ...extra,
});

test("A y B: Relojes genera Smartwatch y Relojes de pared dinámicamente", () => {
  const products = [product("Relojes", "Smartwatch"), product("reloj", "Relojes de pared")]
    .map((item) => ({ ...item, depSlug: normalizeTechnologyDepartment(item.department) }));
  const departments = buildTechnologyDepartments(products);
  const groups = buildTechnologySubcategoryGroups(products, departments);
  expect(departments.find(({ key }) => key === "relojes").count).toBe(2);
  expect(groups.find(({ key }) => key === "relojes").subcats).toEqual(["Relojes de pared", "Smartwatch"]);
});

test("C: Secadores de zapatos queda en Otros con subcategoría dinámica", () => {
  const item = product("Otros", "Secadores de zapatos");
  const products = [{ ...item, depSlug: normalizeTechnologyDepartment(item.department) }];
  const departments = buildTechnologyDepartments(products);
  const groups = buildTechnologySubcategoryGroups(products, departments);
  expect(products[0].depSlug).toBe("otros");
  expect(groups.find(({ key }) => key === "otros").subcats).toEqual(["Secadores de zapatos"]);
});

test("D: un producto de Bolsos nunca pertenece a Tecnología", () => {
  expect(isTechnologyProduct({ category: "Bolsos", catSlug: "bolsos", department: "Mujer", subcategory: "Bolsos Viajeros" })).toBe(false);
});

test("E: Otros siempre es el último y los departamentos futuros son dinámicos", () => {
  const products = [product("Drones", "Mini"), product("Otros", "Accesorios")];
  const departments = buildTechnologyDepartments(products);
  expect(departments.map(({ key }) => key)).toEqual(["bafles", "camaras", "relojes", "grameras", "drones", "otros"]);
});

test("normaliza singular, plural, mayúsculas y espacios sin duplicar contenedores", () => {
  const products = [product(" Relojes ", "Smartwatch"), product("reloj", "Clásico"), product("RELOJES", "Deportivo")];
  const departments = buildTechnologyDepartments(products);
  expect(departments.filter(({ key }) => key === "relojes")).toHaveLength(1);
  expect(departments.find(({ key }) => key === "relojes").count).toBe(3);
  expect(normalizeTechnologyDepartment("Electrónicos")).toBe("otros");
  expect(normalizeTechnologyDepartment("Pesas")).toBe("otros");
  expect(normalizeTechnologyDepartment("Secadores de zapatos")).toBe("otros");
});
