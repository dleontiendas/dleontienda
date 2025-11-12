import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Home from './components/home/Home';
import ProductList from './components/product/ProductList';
import ProductDetail from './components/product/ProductDetail';
import Cart from './components/cart/Cart';
import Checkout from './components/checkout/Checkout';
import Footer from './components/footer/Footer';
import { CartProvider } from './context/CartContext';
import Dashboard from './components/dashboard/Dashboard';
import { ProductsProvider } from './context/ProductContext';
import './App.css';

const App = () => {
  return (
    <CartProvider>
      <ProductsProvider>
        <div className="App">
          <Navbar />
          <div className="App-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/moda" element={<ProductList />} />
 <Route path="/products" element={<ProductList />} />
          {/* ✅ Ruta principal: category + productId */}
          <Route path="/products/:category/:productId" element={<ProductDetail />} />
          {/* ✅ Ruta legacy: solo productId (usa fallback por sku) */}
          <Route path="/products/:productId" element={<ProductDetail />} />
          {/* 404 */}              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </ProductsProvider>
    </CartProvider>
  );
};

export default App;
