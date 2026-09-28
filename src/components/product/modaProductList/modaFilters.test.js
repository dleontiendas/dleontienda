import {
  buildModaSearchParams,
  matchesModaFilters,
  modaCategoryFromSubcategory,
  readModaFilters,
  toModaFilterSlug,
} from "./modaFilters";

test("creates friendly slugs without accents or spaces", () => {
  expect(toModaFilterSlug(" Jeans Skinny Destróyer ")).toBe("jeans-skinny-destroyer");
  expect(modaCategoryFromSubcategory("Jeans Skinny Destroyer")).toBe("jeans");
});

test("reads department, category and subcategory from a direct URL", () => {
  const params = new URLSearchParams(
    "departamento=mujer&categoria=jeans&subcategoria=jeans-skinny-destroyer"
  );
  expect(readModaFilters(params, ["mujer", "niña"])).toEqual({
    department: "mujer",
    category: "jeans",
    subcategory: "jeans-skinny-destroyer",
  });
});

test("normalizes accented department keys and omits redundant subcategory", () => {
  expect(readModaFilters(new URLSearchParams("departamento=nina"), ["mujer", "niña"]).department).toBe("niña");
  expect(buildModaSearchParams({ department: "niña", category: "jeans", subcategory: "jeans" }).toString())
    .toBe("departamento=nina&categoria=jeans");
});

test("matches a category family and then an exact subcategory", () => {
  const product = { depSlug: "mujer", subcategory: "JEANS SKINNY DESTROYER" };
  expect(matchesModaFilters(product, { department: "mujer", category: "jeans", subcategory: "" })).toBe(true);
  expect(matchesModaFilters(product, { department: "mujer", category: "jeans", subcategory: "jeans-skinny-destroyer" })).toBe(true);
  expect(matchesModaFilters(product, { department: "mujer", category: "camisetas", subcategory: "" })).toBe(false);
});
