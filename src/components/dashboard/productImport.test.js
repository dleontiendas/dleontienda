import { buildMasterSku, findExistingProductConflicts, normalizeMasterSku, parseProductRows } from "./productImport";

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
