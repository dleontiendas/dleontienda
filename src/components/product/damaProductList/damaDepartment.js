import { toCategoryFilterSlug } from "../categoryUrlFilters";
import {
  buildConfiguredDepartments,
  buildConfiguredSubcategoryGroups,
  matchesMainCategory,
  normalizeConfiguredDepartment,
} from "../dynamicCategory/dynamicCategory";

export const DAMA_CORE_DEPARTMENTS = [
  { key: "jeans", label: "Jeans", image: "/images/departments/dama/jeans.jpg" },
  { key: "ropa-deportiva", label: "Ropa deportiva", image: "/images/departments/dama/ropa-deportiva.jpg" },
  { key: "blusas", label: "Blusas", image: "/images/departments/dama/blusas.jpg" },
  { key: "ropa-interior", label: "Ropa interior", image: "/images/departments/dama/ropa-interior.jpg" },
  { key: "accesorios", label: "Accesorios", image: "/images/departments/dama/accesorios.jpg" },
  { key: "otros", label: "Otros", image: "/images/departments/dama/otros.jpg" },
];

export const DAMA_CATEGORY_CONFIG = {
  slug: "dama",
  title: "Dama",
  categoryKeys: ["dama", "damas", "mujer", "mujeres", "women", "woman"],
  coreDepartments: DAMA_CORE_DEPARTMENTS,
  fallbackImage: "/images/departments/dama/otros.jpg",
  departmentAliases: [
    { key: "jeans", pattern: /^(?:jean|jeans|denim)(?:-|$)/ },
    { key: "ropa-deportiva", pattern: /^(?:ropa-)?(?:deportiva|deportivo|fitness|activewear)(?:-|$)/ },
    { key: "blusas", pattern: /^(?:blusa|blusas)(?:-|$)/ },
    { key: "ropa-interior", pattern: /^(?:ropa-interior|interior|lenceria|lingerie)(?:-|$)/ },
    { key: "accesorios", pattern: /^(?:accesorio|accesorios|complemento|complementos)(?:-|$)/ },
    { key: "jeans", pattern: /^(?:dama|damas)(?:-|$)/ },
    { key: "otros", pattern: /^(?:otro|otros)(?:-|$)/ },
  ],
};

const isLegacyDamaProduct = (product) => {
  const category = toCategoryFilterSlug(product?.category || product?.catSlug || "");
  const department = toCategoryFilterSlug(product?.department || "");
  return ["ropa", "moda", "fashion", "apparel", "clothing"].includes(category)
    && ["dama", "damas"].includes(department);
};

export const isDamaProduct = (product) =>
  matchesMainCategory(product, DAMA_CATEGORY_CONFIG.categoryKeys) || isLegacyDamaProduct(product);

DAMA_CATEGORY_CONFIG.productMatcher = isDamaProduct;
DAMA_CATEGORY_CONFIG.productDepartmentNormalizer = (product) =>
  isLegacyDamaProduct(product) ? "jeans" : normalizeConfiguredDepartment(product?.department, DAMA_CATEGORY_CONFIG);

export const normalizeDamaDepartment = (value = "") => normalizeConfiguredDepartment(value, DAMA_CATEGORY_CONFIG);
export const buildDamaDepartments = (products = []) => buildConfiguredDepartments(products, DAMA_CATEGORY_CONFIG);
export const buildDamaSubcategoryGroups = (products = [], departments = []) => buildConfiguredSubcategoryGroups(products, departments);
