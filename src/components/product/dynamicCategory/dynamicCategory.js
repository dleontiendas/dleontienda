import { toCategoryFilterSlug } from "../categoryUrlFilters";

export const cleanCategoryLabel = (value, fallback = "") => {
  const label = String(value || "").trim().replace(/\s+/g, " ");
  if (!label) return fallback;
  return label.replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es"));
};

export function matchesMainCategory(product, categoryKeys = []) {
  const keys = new Set(categoryKeys.map(toCategoryFilterSlug));
  const category = toCategoryFilterSlug(product?.category || "");
  if (category) return keys.has(category);
  return keys.has(toCategoryFilterSlug(product?.catSlug || ""));
}

export function normalizeConfiguredDepartment(value, config) {
  const slug = toCategoryFilterSlug(value);
  const alias = (config.departmentAliases || []).find(({ pattern }) => pattern.test(slug));
  return alias?.key || slug || "otros";
}

export function buildConfiguredDepartments(products = [], config) {
  const coreByKey = new Map(config.coreDepartments.map((item) => [item.key, item]));
  const counts = new Map();
  const dynamicLabels = new Map();

  for (const product of products) {
    const key = product?.depSlug || normalizeConfiguredDepartment(product?.department, config);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!coreByKey.has(key) && !dynamicLabels.has(key)) {
      dynamicLabels.set(key, cleanCategoryLabel(product?.department, key));
    }
  }

  const other = coreByKey.get("otros");
  const core = config.coreDepartments.filter(({ key }) => key !== "otros");
  const dynamic = [...dynamicLabels.entries()]
    .map(([key, label]) => ({ key, label, image: other?.image || config.fallbackImage }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  return [...core, ...dynamic, ...(other ? [other] : [])].map((item) => ({
    ...item,
    count: counts.get(item.key) || 0,
  }));
}

export function buildConfiguredSubcategoryGroups(products = [], departments = []) {
  const namesByDepartment = new Map(departments.map(({ key }) => [key, new Map()]));
  for (const product of products) {
    const key = product?.depSlug || "otros";
    if (!namesByDepartment.has(key)) namesByDepartment.set(key, new Map());
    const label = String(product?.subcategory || "").trim().replace(/\s+/g, " ");
    const slug = toCategoryFilterSlug(label);
    // A value equal to its department is a legacy/redundant classification,
    // not a useful subcategory for the customer to select.
    if (slug === toCategoryFilterSlug(key)) continue;
    if (slug && !namesByDepartment.get(key).has(slug)) namesByDepartment.get(key).set(slug, label);
  }
  return departments.map(({ key, label }) => ({
    key,
    label,
    subcats: [...(namesByDepartment.get(key)?.values() || [])].sort((a, b) => a.localeCompare(b, "es")),
  }));
}
