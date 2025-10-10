// App.js
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
import Dashboard from './components/product/Dashboard';
import { ProductsProvider } from './context/ProductContext';
import './App.css';
//import PrivateRoute from './components/PrivateRoute';
//import Logout from './components/Logout';
//import Login from './components/Login';
//import Register from './components/Register';



const App = () => {
  return (
    <CartProvider>
      <ProductsProvider>
        <div>
          <Navbar />
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/dashboard" element={<Dashboard />} />
            

            {/*
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
           

             Protegidas
            <Route path="/chat" element={<PrivateRoute element={<ChatWindow />} />} />
            <Route path="/favorites" element={<PrivateRoute element={<Favorites />} />} />
            <Route path="/settings" element={<PrivateRoute element={<Settings />} />} />
            <Route path="/logout" element={<PrivateRoute element={<Logout />} />} />
            <Route path="/dashboard" element={<Dashboard />} />*/}
          </Routes>
          <Footer />
        </div>
      </ProductsProvider>
    </CartProvider>
  );
};

export default App;

