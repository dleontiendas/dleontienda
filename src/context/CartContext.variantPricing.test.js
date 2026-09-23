import React, { useContext } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartContext, CartProvider } from './CartContext';

const product = {
  id: 'JEAN001',
  price_cop: 90000,
  oldPrice: 100000,
  variants: [{ color: 'AZUL', tallas: [
    { size: '30', price_cop: 110000, oldPrice: 120000, stock: 2 },
    { size: '42', price_cop: 125000, oldPrice: 135000, stock: 2 },
  ] }],
};

function Probe() {
  const { cart, addToCart } = useContext(CartContext);
  return <>
    <button onClick={() => addToCart(product, 1, '42', 'AZUL')}>Agregar 42</button>
    <span data-testid="cart">{JSON.stringify(cart)}</span>
  </>;
}

beforeEach(() => localStorage.clear());

test('el carrito conserva una copia del precio de la talla seleccionada', () => {
  render(<CartProvider><Probe /></CartProvider>);
  fireEvent.click(screen.getByText('Agregar 42'));
  const item = JSON.parse(screen.getByTestId('cart').textContent)[0];
  expect(item).toMatchObject({ selectedSize: '42', selectedColor: 'AZUL', price_cop: 125000, oldPrice: 135000 });
});
