import {
  buildCategorySearchParams,
  categoryFromSubcategory,
  matchesCategoryFilters,
  readCategoryFilters,
  toCategoryFilterSlug,
} from "./categoryUrlFilters";

test("normaliza filtros compartidos para cualquier categoría principal", () => {
  expect(toCategoryFilterSlug("Baño y Decoración")).toBe("bano-y-decoracion");
  expect(categoryFromSubcategory("MORRAL VIAJERO")).toBe("morral");
});

test("lee URLs directas y conserva departamento, categoría y subcategoría", () => {
  expect(readCategoryFilters(
    new URLSearchParams("departamento=mujer&categoria=morral&subcategoria=morral-viajero"),
    ["mujer", "hombre"],
  )).toEqual({ department: "mujer", category: "morral", subcategory: "morral-viajero" });
});

test("construye parámetros amigables y omite una subcategoría redundante", () => {
  expect(buildCategorySearchParams({ department: "Baño", category: "toallas", subcategory: "toallas" }).toString())
    .toBe("departamento=bano&categoria=toallas");
});

test("filtra primero por departamento, luego por familia y selección exacta", () => {
  const product = { depSlug: "mujer", subcategory: "MORRAL VIAJERO GRANDE" };
  expect(matchesCategoryFilters(product, { department: "mujer", category: "morral", subcategory: "" })).toBe(true);
  expect(matchesCategoryFilters(product, { department: "mujer", category: "morral", subcategory: "morral-viajero-grande" })).toBe(true);
  expect(matchesCategoryFilters(product, { department: "hombre", category: "morral", subcategory: "" })).toBe(false);
});
