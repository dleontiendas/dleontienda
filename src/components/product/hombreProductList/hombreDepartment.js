import { toCategoryFilterSlug } from "../categoryUrlFilters";
import {
  buildConfiguredDepartments,
  buildConfiguredSubcategoryGroups,
  matchesMainCategory,
  normalizeConfiguredDepartment,
} from "../dynamicCategory/dynamicCategory";

export const HOMBRE_CORE_DEPARTMENTS = [
  { key: "jeans", label: "Jeans", image: "/images/departments/hombre/jeans.jpg" },
  { key: "camisetas", label: "Camisetas", image: "/images/departments/hombre/camisetas.jpg" },
  { key: "ropa-deportiva", label: "Ropa deportiva", image: "/images/departments/hombre/ropa-deportiva.jpg" },
  { key: "ropa-interior", label: "Ropa interior", image: "/images/departments/hombre/ropa-interior.jpg" },
  { key: "accesorios", label: "Accesorios", image: "/images/departments/hombre/accesorios.jpg" },
  { key: "otros", label: "Otros", image: "/images/departments/hombre/otros.jpg" },
];

export const HOMBRE_CATEGORY_CONFIG = {
  slug: "hombre",
  title: "Hombre",
  categoryKeys: ["hombre", "hombres", "caballero", "caballeros", "men", "man"],
  coreDepartments: HOMBRE_CORE_DEPARTMENTS,
  fallbackImage: "/images/departments/hombre/otros.jpg",
  departmentAliases: [
    { key: "jeans", pattern: /^(?:jean|jeans|denim|pantalon|pantalones)(?:-|$)/ },
    { key: "camisetas", pattern: /^(?:camiseta|camisetas|camisa|camisas|polo|polos)(?:-|$)/ },
    { key: "ropa-deportiva", pattern: /^(?:ropa-)?(?:deportiva|deportivo|fitness|activewear|capri)(?:-|$)/ },
    { key: "ropa-interior", pattern: /^(?:ropa-interior|interior|boxer|boxers|pijama|pijamas)(?:-|$)/ },
    { key: "accesorios", pattern: /^(?:accesorio|accesorios|complemento|complementos)(?:-|$)/ },
    { key: "otros", pattern: /^(?:otro|otros)(?:-|$)/ },
  ],
};

const legacyCategory = product => ["ropa", "moda", "fashion", "apparel", "clothing"].includes(toCategoryFilterSlug(product?.category || product?.catSlug || ""));
const legacyDepartment = product => ["hombre", "hombres", "caballero", "caballeros"].includes(toCategoryFilterSlug(product?.department || ""));
export const isLegacyHombreProduct = product => legacyCategory(product) && legacyDepartment(product);

export const legacyHombreDepartment = product => {
  const subcategory = toCategoryFilterSlug(product?.subcategory || "");
  if (/^capri(?:-|$)/.test(subcategory)) return "ropa-deportiva";
  if (/^(?:jean|jeans|pantalon|pantalones)(?:-|$)/.test(subcategory)) return "jeans";
  return "otros";
};

export const isHombreProduct = product =>
  matchesMainCategory(product, HOMBRE_CATEGORY_CONFIG.categoryKeys) || isLegacyHombreProduct(product);

HOMBRE_CATEGORY_CONFIG.productMatcher = isHombreProduct;
HOMBRE_CATEGORY_CONFIG.productDepartmentNormalizer = product =>
  isLegacyHombreProduct(product) ? legacyHombreDepartment(product) : normalizeConfiguredDepartment(product?.department, HOMBRE_CATEGORY_CONFIG);

export const normalizeHombreDepartment = (value = "") => normalizeConfiguredDepartment(value, HOMBRE_CATEGORY_CONFIG);
export const buildHombreDepartments = (products = []) => buildConfiguredDepartments(products, HOMBRE_CATEGORY_CONFIG);
export const buildHombreSubcategoryGroups = (products = [], departments = []) => buildConfiguredSubcategoryGroups(products, departments);
