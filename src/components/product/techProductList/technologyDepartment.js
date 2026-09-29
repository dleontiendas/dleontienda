import { toCategoryFilterSlug } from "../categoryUrlFilters";

export const TECHNOLOGY_CORE_DEPARTMENTS = [
  { key: "bafles", label: "Bafles", image: "/images/departments/technology/bafles.jpg" },
  { key: "camaras", label: "Cámaras", image: "/images/departments/technology/camaras.jpg" },
  { key: "relojes", label: "Relojes", image: "/images/departments/technology/relojes.jpg" },
  { key: "grameras", label: "Grameras", image: "/images/departments/technology/grameras.jpg" },
  { key: "otros", label: "Otros", image: "/images/departments/technology/otros.jpg" },
];

const TECHNOLOGY_CATEGORY_KEYS = new Set([
  "tecnologia",
  "technology",
  "tech",
  "electronica",
  "electronicos",
]);

const OTHER_DEPARTMENT_PATTERNS = [
  /^otro(?:s)?(?:-|$)/,
  /^electronica(?:-|$)/,
  /^electronico(?:s)?(?:-|$)/,
  /^tecnologia(?:-|$)/,
  /^accesorio(?:s)?(?:-|$)/,
  /^pesa(?:s)?(?:-|$)/,
  /^secador(?:es)?-de-zapato(?:s)?(?:-|$)/,
];

const knownDepartment = (slug) => {
  if (/^(?:bafle|bafles|parlante|parlantes|altavoz|altavoces|speaker|speakers)(?:-|$)/.test(slug)) return "bafles";
  if (/^(?:camara|camaras|camera|cameras)(?:-|$)/.test(slug)) return "camaras";
  if (/^(?:reloj|relojes|watch|watches|smartwatch|smartwatches)(?:-|$)/.test(slug)) return "relojes";
  if (/^(?:gramera|grameras|bascula|basculas|balanza|balanzas|scale|scales)(?:-|$)/.test(slug)) return "grameras";
  if (OTHER_DEPARTMENT_PATTERNS.some((pattern) => pattern.test(slug))) return "otros";
  return "";
};

export const normalizeTechnologyDepartment = (value = "") => {
  const slug = toCategoryFilterSlug(value);
  return knownDepartment(slug) || slug || "otros";
};

const cleanDepartmentLabel = (value, fallback) => {
  const label = String(value || "").trim().replace(/\s+/g, " ");
  if (!label) return fallback;
  return label.replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es"));
};

export const isTechnologyProduct = (product) => {
  const category = toCategoryFilterSlug(product?.category || "");
  if (category) return TECHNOLOGY_CATEGORY_KEYS.has(category);
  return TECHNOLOGY_CATEGORY_KEYS.has(toCategoryFilterSlug(product?.catSlug || ""));
};

export function buildTechnologyDepartments(products = []) {
  const coreByKey = new Map(TECHNOLOGY_CORE_DEPARTMENTS.map((item) => [item.key, item]));
  const counts = new Map();
  const dynamicLabels = new Map();

  for (const product of products) {
    const key = normalizeTechnologyDepartment(product?.department);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!coreByKey.has(key) && !dynamicLabels.has(key)) {
      dynamicLabels.set(key, cleanDepartmentLabel(product?.department, key));
    }
  }

  const other = coreByKey.get("otros");
  const core = TECHNOLOGY_CORE_DEPARTMENTS.filter(({ key }) => key !== "otros");
  const dynamic = [...dynamicLabels.entries()]
    .map(([key, label]) => ({ key, label, image: other.image }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  return [...core, ...dynamic, other].map((item) => ({
    ...item,
    count: counts.get(item.key) || 0,
  }));
}

export function buildTechnologySubcategoryGroups(products = [], departments = []) {
  const namesByDepartment = new Map(departments.map(({ key }) => [key, new Map()]));
  for (const product of products) {
    const key = product?.depSlug || normalizeTechnologyDepartment(product?.department);
    if (!namesByDepartment.has(key)) namesByDepartment.set(key, new Map());
    const label = String(product?.subcategory || "").trim().replace(/\s+/g, " ");
    const slug = toCategoryFilterSlug(label);
    if (slug && !namesByDepartment.get(key).has(slug)) {
      namesByDepartment.get(key).set(slug, label);
    }
  }
  return departments.map(({ key, label }) => ({
    key,
    label,
    subcats: [...(namesByDepartment.get(key)?.values() || [])]
      .sort((a, b) => a.localeCompare(b, "es")),
  }));
}
