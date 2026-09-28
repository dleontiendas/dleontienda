const stripAccents = (value = "") =>
  String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const toModaFilterSlug = (value = "") =>
  stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const modaCategoryFromSubcategory = (subcategory = "") =>
  toModaFilterSlug(subcategory).split("-")[0] || "";

export function readModaFilters(searchParams, departmentKeys = []) {
  const rawDepartment = toModaFilterSlug(searchParams.get("departamento") || "");
  const department =
    departmentKeys.find((key) => toModaFilterSlug(key) === rawDepartment) || "";
  const subcategory = toModaFilterSlug(searchParams.get("subcategoria") || "");
  const category =
    toModaFilterSlug(searchParams.get("categoria") || "") ||
    modaCategoryFromSubcategory(subcategory);

  return { department, category, subcategory };
}

export function buildModaSearchParams({ department = "", category = "", subcategory = "" }) {
  const params = new URLSearchParams();
  const departmentSlug = toModaFilterSlug(department);
  const subcategorySlug = toModaFilterSlug(subcategory);
  const categorySlug =
    toModaFilterSlug(category) || modaCategoryFromSubcategory(subcategorySlug);

  if (departmentSlug) params.set("departamento", departmentSlug);
  if (categorySlug) params.set("categoria", categorySlug);
  if (subcategorySlug && subcategorySlug !== categorySlug) {
    params.set("subcategoria", subcategorySlug);
  }
  return params;
}

export function matchesModaFilters(product, filters) {
  const productDepartment = toModaFilterSlug(product?.depSlug || "");
  const productSubcategory = toModaFilterSlug(product?.subcategory || "");
  const productCategory = modaCategoryFromSubcategory(productSubcategory);

  return (
    (!filters.department || productDepartment === toModaFilterSlug(filters.department)) &&
    (!filters.category || productCategory === filters.category) &&
    (!filters.subcategory || productSubcategory === filters.subcategory)
  );
}
