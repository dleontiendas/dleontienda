import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./Firebase', () => ({ db: {}, auth: {}, functions: {}, usingFirebaseEmulators: true }));
jest.mock('./api/paymentsApi', () => ({ createPayment: jest.fn() }));
jest.mock('./api/axiosClient', () => ({ post: jest.fn(), get: jest.fn() }));
jest.mock('./context/AuthContext', () => ({ AuthProvider: ({ children }) => children, AuthContext: require('react').createContext({ user: null, loading: false }) }));
jest.mock('./context/ProductContext', () => ({ ProductsProvider: ({ children }) => children, ProductsContext: require('react').createContext({ products: [], loading: false }) }));

test('renders the storefront category route without loading Meta tracking', () => {
  window.scrollTo = jest.fn();
  render(<MemoryRouter initialEntries={['/moda']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Moda', level: 4 })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Categorías' })).toBeInTheDocument();
  expect(document.querySelector('script[src*="facebook"]')).toBeNull();
});

test('renders Hombre as a main category route', () => {
  window.scrollTo = jest.fn();
  render(<MemoryRouter initialEntries={['/hombre']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Hombre', level: 4 })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Hombre' })).toHaveAttribute('href', '/hombre');
});

test('renders Dama as a main category route', () => {
  window.scrollTo = jest.fn();
  render(<MemoryRouter initialEntries={['/dama']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Dama', level: 4 })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Dama' })).toHaveAttribute('href', '/dama');
});
