const stripAccents = (value = "") =>
  String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const toCategoryFilterSlug = (value = "") =>
  stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const categoryFromSubcategory = (subcategory = "") =>
  toCategoryFilterSlug(subcategory).split("-")[0] || "";

export function readCategoryFilters(searchParams, departmentKeys = []) {
  const rawDepartment = toCategoryFilterSlug(searchParams.get("departamento") || "");
  const department =
    departmentKeys.find((key) => toCategoryFilterSlug(key) === rawDepartment) || "";
  const subcategory = toCategoryFilterSlug(searchParams.get("subcategoria") || "");
  const category =
    toCategoryFilterSlug(searchParams.get("categoria") || "") ||
    categoryFromSubcategory(subcategory);

  return { department, category, subcategory };
}

export function buildCategorySearchParams({ department = "", category = "", subcategory = "" }) {
  const params = new URLSearchParams();
  const departmentSlug = toCategoryFilterSlug(department);
  const subcategorySlug = toCategoryFilterSlug(subcategory);
  const categorySlug =
    toCategoryFilterSlug(category) || categoryFromSubcategory(subcategorySlug);

  if (departmentSlug) params.set("departamento", departmentSlug);
  if (categorySlug) params.set("categoria", categorySlug);
  if (subcategorySlug && subcategorySlug !== categorySlug) {
    params.set("subcategoria", subcategorySlug);
  }
  return params;
}

export function matchesCategoryFilters(product, filters) {
  const productDepartment = toCategoryFilterSlug(product?.depSlug || "");
  const productSubcategory = toCategoryFilterSlug(product?.subcategory || "");
  const productCategory = categoryFromSubcategory(productSubcategory);

  return (
    (!filters.department || productDepartment === toCategoryFilterSlug(filters.department)) &&
    (!filters.category || productCategory === filters.category) &&
    (!filters.subcategory || productSubcategory === filters.subcategory)
  );
}
