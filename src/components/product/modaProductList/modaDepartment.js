const normalizeDepartment = (value = "") =>
  String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const MODA_DEPARTMENT_GROUPS = [
  { key: "mujer", label: "Mujer" },
  { key: "hombre", label: "Hombre" },
  { key: "unisex", label: "Unisex" },
  { key: "infantil", label: "Infantil" },
];

export const getModaDepartmentGroup = (department) => {
  const value = normalizeDepartment(department);
  if (value.includes("unisex")) return "unisex";
  if (
    value.includes("infantil") || value.includes("kids") ||
    value.includes("nina") || value.includes("ninas") || value.includes("girl") || value.includes("girls") ||
    value.includes("nino") || value.includes("ninos") || value.includes("boy") || value.includes("boys")
  ) return "infantil";
  if (value.includes("mujer") || value.includes("dama") || value.includes("damas") || value.includes("women")) return "mujer";
  if (value.includes("hombre") || value.includes("caballero") || value.includes("caballeros") || value.includes("men")) return "hombre";
  if (value.includes("complement") || value.includes("accesorio")) return "complementos";
  return "otros";
};
