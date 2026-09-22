import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from './Cart';
import { CartContext } from '../../context/CartContext';
jest.mock('../../context/CartContext', () => ({ CartContext: require('react').createContext({}) }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
const product = { id: 'BIX', name: 'Jeans', price_cop: 135000, quantity: 1, selectedColor: 'NEGRO', selectedSize: '28' };
function TestCart({ remove = jest.fn(), update = jest.fn() }) {
  const [deliveryMethod, setDeliveryMethod] = React.useState('delivery');
  return <CartContext.Provider value={{ cart: [product], removeFromCart: remove, updateQuantity: update, deliveryMethod, setDeliveryMethod }}><Cart /></CartContext.Provider>;
}
test('domicilio conserva 25000 y recogida elimina solo el envío', () => {
  const { container } = render(<TestCart />);
  expect(container.querySelector('.summary-total')).toHaveTextContent('$160.000');
  fireEvent.click(screen.getByRole('radio', { name: /Recoger en tienda/ }));
  expect(container.querySelector('.summary-total')).toHaveTextContent('$135.000');
  expect(screen.getByText('Recogida en tienda:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /IR A PAGAR/ })).toBeEnabled();
  expect(screen.queryByText('Eliminar todo')).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: /Envío a domicilio/ }));
  expect(container.querySelector('.summary-total')).toHaveTextContent('$160.000');
});
test('conserva los argumentos de cantidad y eliminación individual', () => {
  const remove = jest.fn(); const update = jest.fn();
  render(<TestCart remove={remove} update={update} />);
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Jeans' }));
  expect(update).toHaveBeenCalledWith('BIX', '28', 'NEGRO', 2);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Jeans' }));
  expect(remove).toHaveBeenCalledWith('BIX', '28', 'NEGRO');
});
