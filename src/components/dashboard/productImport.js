const REQUIRED_HEADERS = [
  "COD Ref SKU",
  "Marca",
  "Actualizar inventario",
  "Color",
  "Talla",
  "Cantidad",
];

export const toImportString = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

export const toImportNumber = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

export const normalizeMasterSku = (value) =>
  toImportString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");

export const buildMasterSku = ({ brand, baseSku, color, size }) =>
  [brand, baseSku, color, size]
    .map((part) => normalizeMasterSku(part).replace(/-+/g, ""))
    .filter(Boolean)
    .join("-");

export const normalizeInventoryFlag = (value) =>
  toImportString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

export const findExistingProductConflicts = (products, existingProducts) => {
  const existingBySku = new Map(
    (Array.isArray(existingProducts) ? existingProducts : [])
      .map((product) => [toImportString(product?.sku), product])
      .filter(([sku]) => sku),
  );

  return (Array.isArray(products) ? products : []).flatMap((incoming) => {
    const sku = toImportString(incoming?.sku);
    const existing = existingBySku.get(sku);
    return existing ? [{
      sku,
      existingName: toImportString(existing.name) || "Producto sin nombre",
      incomingName: toImportString(incoming.name) || "Producto sin nombre",
    }] : [];
  });
};

const normalizeDriveLink = (value) => {
  const url = toImportString(value);
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return match
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w1200&id=${match[1]}`
    : url;
};

const addUnique = (array, value) => {
  if (value && !array.includes(value)) array.push(value);
};

export function parseProductRows(rows, headers = null) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const availableHeaders = headers || Object.keys(sourceRows[0] || {});
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !availableHeaders.includes(header));
  const errors = missingHeaders.map((header) => ({
    row: 1,
    field: header,
    message: `Falta la columna obligatoria "${header}".`,
  }));

  if (missingHeaders.length) return { products: [], errors, rowCount: sourceRows.length };

  const seenMasterSkus = new Map();
  const grouped = new Map();

  sourceRows.forEach((row, index) => {
    const excelRow = index + 2;
    const baseSku = toImportString(row["COD Ref SKU"]);
    const rawMasterSku = toImportString(row["SKU Maestro"]);
    const brand = toImportString(row.Marca);
    const inventoryFlag = normalizeInventoryFlag(row["Actualizar inventario"]);
    const color = toImportString(row.Color);
    const size = toImportString(row.Talla);
    const masterSku = rawMasterSku
      ? normalizeMasterSku(rawMasterSku)
      : buildMasterSku({ brand, baseSku, color, size });
    const rawQuantity = row.Cantidad;
    const quantity = Number(rawQuantity);

    if (!baseSku) errors.push({ row: excelRow, field: "COD Ref SKU", message: "La referencia base está vacía." });
    if (!brand) errors.push({ row: excelRow, field: "Marca", message: "La marca está vacía; se necesita para generar el SKU Maestro." });
    if (!masterSku) errors.push({ row: excelRow, field: "SKU Maestro", message: "No fue posible generar un SKU Maestro válido." });
    if (masterSku && seenMasterSkus.has(masterSku)) {
      errors.push({
        row: excelRow,
        field: "SKU Maestro",
        message: `SKU Maestro duplicado; también aparece en la fila ${seenMasterSkus.get(masterSku)}.`,
      });
    } else if (masterSku) {
      seenMasterSkus.set(masterSku, excelRow);
    }
    if (!color) errors.push({ row: excelRow, field: "Color", message: "El color está vacío." });
    if (!size) errors.push({ row: excelRow, field: "Talla", message: "La talla está vacía." });
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
      errors.push({ row: excelRow, field: "Cantidad", message: "La cantidad debe ser un entero mayor o igual a cero." });
    }
    if (!new Set(["SI", "NO"]).has(inventoryFlag)) {
      errors.push({ row: excelRow, field: "Actualizar inventario", message: "Debe contener SÍ o NO." });
    }

    if (!baseSku || !brand || !masterSku || !color || !size || !Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity) || !new Set(["SI", "NO"]).has(inventoryFlag)) return;

    if (!grouped.has(baseSku)) {
      grouped.set(baseSku, {
        sku: baseSku,
        name: toImportString(row.Nombre),
        brand,
        category: toImportString(row["Categoría"]),
        subcategory: toImportString(row["Sub-Categoría"]),
        department: toImportString(row.Departamento),
        description: toImportString(row["Descripción"]),
        materials: toImportString(row["Materiales y composición"]),
        care_instructions: toImportString(row["Cuidados y lavado"]),
        warranty: toImportString(row["Garantía"]),
        price_cop: toImportNumber(row["Precio (COL)"]),
        weight_grams: toImportNumber(row["Peso (Gr)"]),
        images: [],
        variants: [],
      });
    }

    const product = grouped.get(baseSku);
    const metadata = {
      name: ["name", "Nombre"],
      brand: ["brand", "Marca"],
      category: ["category", "Categoría"],
      subcategory: ["subcategory", "Sub-Categoría"],
      department: ["department", "Departamento"],
      description: ["description", "Descripción"],
      materials: ["materials", "Materiales y composición"],
      care_instructions: ["care_instructions", "Cuidados y lavado"],
      warranty: ["warranty", "Garantía"],
    };
    Object.values(metadata).forEach(([field, header]) => {
      const value = toImportString(row[header]);
      if (value && !product[field]) product[field] = value;
    });
    if (!product.price_cop) product.price_cop = toImportNumber(row["Precio (COL)"]);
    if (!product.weight_grams) product.weight_grams = toImportNumber(row["Peso (Gr)"]);

    ["Imagen Principal", "Imagen1", "Imagen2"].forEach((header) =>
      addUnique(product.images, normalizeDriveLink(row[header])),
    );

    let variant = product.variants.find((item) => item.color === color);
    if (!variant) {
      variant = { color, images: [], tallas: [] };
      product.variants.push(variant);
    }
    ["Imagen Color 1", "Imagen Color 2"].forEach((header) =>
      addUnique(variant.images, normalizeDriveLink(row[header])),
    );
    variant.tallas.push({
      size,
      stock: quantity,
      sku_master: masterSku,
      update_inventory: inventoryFlag === "SI",
      source_row: excelRow,
    });
  });

  return { products: errors.length ? [] : Array.from(grouped.values()), errors, rowCount: sourceRows.length };
}

export { REQUIRED_HEADERS };
