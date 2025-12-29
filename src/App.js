// FILE: src/App.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"; 

import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import TechProductList from "./components/product/techProductList/techProductList";
import ModaProductList from "./components/product/modaProductList/modaProductList";
import ProductList from "./components/product/ProductList";
import ProductDetail from "./components/product/ProductDetail";
import Cart from "./components/cart/Cart";
import Checkout from "./components/checkout/Checkout";
import Footer from "./components/footer/Footer";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductContext";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import PromoBar from "./components/PromoBar";
import Terminos from "./components/legales/Terminos";
import Privacidad from "./components/legales//Privacidad";
import Garantias from "./components/legales/Garantias";
import Envios from "./components/legales/Envios";
import AvisoLegal from "./components/legales/AvisoLegal";

import "./App.css";

const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <ProductsProvider>
            <div className="App">
              <PromoBar />
              <Navbar />
              <div className="App-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/moda" element={<ModaProductList />} />
                  <Route path="/tecnologia" element={<TechProductList />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:category/:productId" element={<ProductDetail />} />
                  <Route path="/products/:productId" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="/garantias" element={<Garantias />} />
                  <Route path="/envios" element={<Envios />} />
                  <Route path="/aviso-legal" element={<AvisoLegal />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
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
    </HelmetProvider>
  );
};

export default App;
