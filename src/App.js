// src/App.js  (usa .js en imports; NO .jsx)
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
import { ProductsProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';      // <- .js
import RequireAuth from './components/auth/RequireAuth';   // <- .js
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/login/Login';
import Register from './components/register/Register';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <ProductsProvider>
          <div className="App">
            <Navbar />
            <div className="App-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/moda" element={<ProductList />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:category/:productId" element={<ProductDetail />} />
                <Route path="/products/:productId" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth /* role="admin" */>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
              </Routes>
            </div>
            <Footer />
          </div>
        </ProductsProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
