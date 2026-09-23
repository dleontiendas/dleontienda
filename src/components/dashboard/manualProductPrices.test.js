import { calculateManualSavings, normalizeManualProductPrices, normalizeManualVariantPrices } from './manualProductPrices';

test('conserva los dos precios escritos y calcula el ahorro solo para la vista previa', () => {
  expect(normalizeManualProductPrices('110000', '135000')).toEqual({ price_cop: 110000, oldPrice: 135000 });
  expect(calculateManualSavings('110000', '135000')).toEqual({
    price: 110000,
    oldPrice: 135000,
    savings: 25000,
    percentage: 19,
  });
});

test('permite dejar o volver a dejar vacío el precio anterior', () => {
  expect(normalizeManualProductPrices(110000, '')).toEqual({ price_cop: 110000, oldPrice: null });
  expect(normalizeManualProductPrices(120000, null)).toEqual({ price_cop: 120000, oldPrice: null });
  expect(calculateManualSavings(110000, '')).toBeNull();
});

test('permite editar ambos precios sin calcular oldPrice automáticamente', () => {
  expect(normalizeManualProductPrices(95000, 140000)).toEqual({ price_cop: 95000, oldPrice: 140000 });
  expect(normalizeManualProductPrices(99000, 125000)).toEqual({ price_cop: 99000, oldPrice: 125000 });
});

test('no muestra descuento cuando el precio anterior es igual o menor', () => {
  expect(calculateManualSavings(110000, 110000)).toBeNull();
  expect(calculateManualSavings(110000, 100000)).toBeNull();
});

test('rechaza precios inválidos', () => {
  expect(() => normalizeManualProductPrices(0, '')).toThrow(/precio actual/i);
  expect(() => normalizeManualProductPrices(110000, 0)).toThrow(/precio anterior/i);
});

test('normaliza precios opcionales por talla sin inventar precio anterior', () => {
  expect(normalizeManualVariantPrices('125000', '135000')).toEqual({ price_cop: 125000, oldPrice: 135000 });
  expect(normalizeManualVariantPrices('', '')).toEqual({ oldPrice: null });
  expect(normalizeManualVariantPrices('110000', '')).toEqual({ price_cop: 110000, oldPrice: null });
  expect(normalizeManualVariantPrices(undefined, undefined)).toEqual({});
});
