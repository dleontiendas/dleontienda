import { getDeliveryCost } from './delivery';

test.each([
  ['delivery', '052810', 10000],
  ['delivery', ' 052810 ', 10000],
  ['delivery', '052811', 25000],
  ['delivery', '', 25000],
  ['delivery', undefined, 25000],
  ['pickup', '052810', 0],
  ['pickup', '110111', 0],
])('tarifa %s para %s = %i', (method, code, expected) => {
  expect(getDeliveryCost(method, code)).toBe(expected);
});
