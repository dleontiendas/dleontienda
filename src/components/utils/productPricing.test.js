import { resolveProductPricing } from './productPricing';

const product = {
  price_cop: 90000,
  oldPrice: 100000,
  variants: [{ color: 'AZUL', tallas: [
    { size: '30', price_cop: 110000, oldPrice: 120000, stock: 2 },
    { size: '42', price_cop: 125000, oldPrice: 135000, stock: 1 },
    { size: '44', price_cop: 125000, oldPrice: null, stock: 1 },
  ] }],
};

test('resuelve precio y ahorro exclusivamente desde la talla seleccionada', () => {
  expect(resolveProductPricing(product, 'AZUL', '30')).toMatchObject({ price: 110000, oldPrice: 120000, savings: 10000, percentage: 8, hasDiscount: true });
  expect(resolveProductPricing(product, 'AZUL', '42')).toMatchObject({ price: 125000, oldPrice: 135000, savings: 10000, percentage: 7, hasDiscount: true });
});

test('oldPrice nulo en la talla no hereda un descuento general', () => {
  expect(resolveProductPricing(product, 'AZUL', '44')).toMatchObject({ price: 125000, oldPrice: null, hasDiscount: false });
});

test('producto antiguo usa sus precios generales', () => {
  const legacy = { ...product, variants: [{ color: 'AZUL', tallas: [{ size: '30', stock: 2 }] }] };
  expect(resolveProductPricing(legacy, 'AZUL', '30')).toMatchObject({ price: 90000, oldPrice: 100000, hasDiscount: true });
});
