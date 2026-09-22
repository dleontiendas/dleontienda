import { buildMasterSku, findExistingProductConflicts, normalizeMasterSku, parseProductRows, parseImportPrice } from "./productImport";
import * as XLSX from "xlsx";

test.each([120000, "120000", "$120.000", "COP 120,000", "$ 120.000,00", "120,000.00", "120000,00"])("normaliza el importe %s", (value) => {
  expect(parseImportPrice(value)).toBe(120000);
});

test.each(["abc", "$", "12.34.56", true, Infinity, "120000 pesos"])("rechaza importe mal formado %s", (value) => {
  expect(Number.isNaN(parseImportPrice(value))).toBe(true);
});

test("lee un archivo Excel con precios nuevos, opcional vacío y formato antiguo", () => {
  const rows = [
    row({ "COD Ref SKU": "BIX605", "SKU Maestro": "BIX605-A-32", "Precio actual": 110000, "Precio anterior": "$120.000" }),
    row({ "COD Ref SKU": "OR120", "SKU Maestro": "OR120-A-U", "Precio actual": 120000, "Precio anterior": "" }),
    row({ "Precio actual": "", "Precio (COL)": 95000 }),
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Productos");
  const read = XLSX.read(XLSX.write(book, { type: "array", bookType: "xlsx" }), { type: "array" });
  const result = parseProductRows(XLSX.utils.sheet_to_json(read.Sheets.Productos, { defval: "" }));
  expect(result.errors).toEqual([]);
  expect(result.products.map(({ price_cop, oldPrice }) => ({ price_cop, oldPrice }))).toEqual([
    { price_cop: 110000, oldPrice: 120000 }, { price_cop: 120000, oldPrice: null }, { price_cop: 95000, oldPrice: null },
  ]);
});

test.each([0, -1, "abc", ""])("rechaza precio actual inválido %s", (value) => {
  expect(parseProductRows([row({ "Precio (COL)": value })]).errors.length).toBeGreaterThan(0);
});

test.each([0, -1, "abc"])("rechaza precio anterior inválido %s", (value) => {
  expect(parseProductRows([row({ "Precio anterior": value })]).errors.length).toBeGreaterThan(0);
});

test.each([100000, 110000])("permite precio anterior menor o igual %s", (value) => {
  const result = parseProductRows([row({ "Precio anterior": value })]);
  expect(result.errors).toEqual([]);
  expect(result.products[0].oldPrice).toBe(value);
});

test("rechaza precios contradictorios entre variaciones del mismo producto", () => {
  const result = parseProductRows([row(), row({ Talla: 6, "SKU Maestro": "OTRO-6", "Precio actual": 90000 })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ field: "Precio actual / Precio anterior" }));
});

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
  "Precio (COL)": 110000,
  "SKU Maestro": "Cool Kids-CKG0002-Sónic 1-4",
  "Actualizar inventario": "SÍ",
  ...overrides,
});

test("normaliza SKU Maestro en mayúsculas, sin tildes, espacios o caracteres especiales", () => {
  expect(normalizeMasterSku(" Cool Kids-Ázul 1-32 / ")).toBe("COOLKIDS-AZUL1-32");
});

test("genera SKU Maestro automáticamente desde marca, referencia, color y talla", () => {
  expect(buildMasterSku({ brand: "Cool Kids", baseSku: "CKG0002", color: "SÓNIC 1", size: 4 }))
    .toBe("COOLKIDS-CKG0002-SONIC1-4");
});

test("importa una matriz sin columna SKU Maestro y lo asocia a cada talla", () => {
  const first = row();
  const second = row({ Talla: 6 });
  delete first["SKU Maestro"];
  delete second["SKU Maestro"];
  const result = parseProductRows([first, second]);
  expect(result.errors).toEqual([]);
  expect(result.products[0].variants[0].tallas.map((item) => item.sku_master)).toEqual([
    "COOLKIDS-CKG0002-SONIC1-4",
    "COOLKIDS-CKG0002-SONIC1-6",
  ]);
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

test("rechaza una fila sin marca porque no puede generar el SKU Maestro", () => {
  const result = parseProductRows([row({ Marca: "", "SKU Maestro": "" })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "Marca" }));
});

test("rechaza una fila inválida con cantidad negativa", () => {
  const result = parseProductRows([row({ Cantidad: -1 })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "Cantidad" }));
});

test("rechaza valores de control de inventario distintos de SÍ o NO", () => {
  const result = parseProductRows([row({ "Actualizar inventario": "QUIZÁS" })]);
  expect(result.errors).toContainEqual(expect.objectContaining({ row: 2, field: "Actualizar inventario" }));
});

test("identifica referencias base existentes antes de importar", () => {
  const conflicts = findExistingProductConflicts(
    [{ sku: "CKG0002", name: "Nombre desde Excel" }, { sku: "NUEVO1", name: "Nuevo" }],
    [{ sku: "CKG0002", name: "Producto almacenado" }],
  );
  expect(conflicts).toEqual([{
    sku: "CKG0002",
    existingName: "Producto almacenado",
    incomingName: "Nombre desde Excel",
  }]);
});
