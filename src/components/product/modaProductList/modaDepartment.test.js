import { getModaDepartmentGroup } from "./modaDepartment";

test.each([
  ["MUJER", "mujer"],
  ["HOMBRE", "hombre"],
  ["UNISEX", "unisex"],
  ["NIÑA", "niña"],
  ["NIÑO", "niño"],
  ["INFANTIL", "infantil"],
  ["UNISEX INFANTIL", "infantil"],
])("agrupa el departamento %s dentro de %s", (department, expected) => {
  expect(getModaDepartmentGroup(department)).toBe(expected);
});
