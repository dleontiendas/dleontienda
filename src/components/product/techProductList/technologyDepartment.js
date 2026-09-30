import {
  buildConfiguredDepartments,
  buildConfiguredSubcategoryGroups,
  matchesMainCategory,
  normalizeConfiguredDepartment,
} from "../dynamicCategory/dynamicCategory";

export const TECHNOLOGY_CORE_DEPARTMENTS = [
  { key: "bafles", label: "Bafles", image: "/images/departments/technology/bafles.jpg" },
  { key: "camaras", label: "Cámaras", image: "/images/departments/technology/camaras.jpg" },
  { key: "relojes", label: "Relojes", image: "/images/departments/technology/relojes.jpg" },
  { key: "grameras", label: "Grameras", image: "/images/departments/technology/grameras.jpg" },
  { key: "otros", label: "Otros", image: "/images/departments/technology/otros.jpg" },
];

export const TECHNOLOGY_CATEGORY_CONFIG = {
  slug: "tecnologia",
  title: "Tecnología",
  categoryKeys: ["tecnologia", "technology", "tech", "electronica", "electronicos"],
  coreDepartments: TECHNOLOGY_CORE_DEPARTMENTS,
  fallbackImage: "/images/departments/technology/otros.jpg",
  departmentAliases: [
    { key: "bafles", pattern: /^(?:bafle|bafles|parlante|parlantes|altavoz|altavoces|speaker|speakers)(?:-|$)/ },
    { key: "camaras", pattern: /^(?:camara|camaras|camera|cameras)(?:-|$)/ },
    { key: "relojes", pattern: /^(?:reloj|relojes|watch|watches|smartwatch|smartwatches)(?:-|$)/ },
    { key: "grameras", pattern: /^(?:gramera|grameras|bascula|basculas|balanza|balanzas|scale|scales)(?:-|$)/ },
    { key: "otros", pattern: /^(?:otro|otros|electronica|electronico|electronicos|tecnologia|accesorio|accesorios|pesa|pesas|secador|secadores)(?:-|$)/ },
  ],
};

export const normalizeTechnologyDepartment = (value = "") => normalizeConfiguredDepartment(value, TECHNOLOGY_CATEGORY_CONFIG);
export const isTechnologyProduct = (product) => matchesMainCategory(product, TECHNOLOGY_CATEGORY_CONFIG.categoryKeys);
export const buildTechnologyDepartments = (products = []) => buildConfiguredDepartments(products, TECHNOLOGY_CATEGORY_CONFIG);
export const buildTechnologySubcategoryGroups = (products = [], departments = []) => buildConfiguredSubcategoryGroups(products, departments);
