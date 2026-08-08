import { normalizeMasterSku, parseProductRows } from "./productImport";

const row = (overrides = {}) => ({
  "COD Ref SKU": "CKG0002",
  Nombre: "Pijama",
  Marca: "Cool Kids",
  "Categoría": "ROPA",
  "Sub-Categoría": "PIJAMA",
  Departamento: "NIÑO",
  Color: "SÓNIC 1",
  Talla: 4,
  Cantidad: 2,
  "SKU Maestro": "Cool Kids-CKG0002-Sónic 1-4",
  "Actualizar inventario": "SÍ",
  ...overrides,
});

test("normaliza SKU Maestro en mayúsculas, sin tildes, espacios o caracteres especiales", () => {
  expect(normalizeMasterSku(" Cool Kids-Ázul 1-32 / ")).toBe("COOLKIDS-AZUL1-32");
});

test("agrupa filas por referencia base y conserva SKU Maestro por talla", () => {
  const result = parseProductRows([row(), row({ Talla: 6, "SKU Maestro": "COOLKIDS-CKG0002-SONIC1-6" })]);
  expect(result.errors).toEqual([]);
  expect(result.products).toHaveLength(1);
  expect(result.products[0].variants[0].tallas).toHaveLength(2);
  expect(result.products[0].variants[0].tallas[0].sku_master).toBe("COOLKIDS-CKG0002-SONIC1-4");
});

test("rechaza SKU Maestro duplicado indicando la fila", () => {
  const result = parseProductRows([row(), row()]);
  expect(result.products).toEqual([]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 3, field: "SKU Maestro" }));
});

test("rechaza SKU Maestro vacío", () => {
  const result = parseProductRows([row({ "SKU Maestro": "" })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "SKU Maestro" }));
});

test("rechaza una fila inválida con cantidad negativa", () => {
  const result = parseProductRows([row({ Cantidad: -1 })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "Cantidad" }));
});

test("rechaza valores de control de inventario distintos de SÍ o NO", () => {
  const result = parseProductRows([row({ "Actualizar inventario": "QUIZÁS" })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "Actualizar inventario" }));
});
