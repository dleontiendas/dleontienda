import MetaPageView from "./meta/MetaPageView";
// FILE: src/App.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"; 
import CheckoutSuccess from "./components/checkout/CheckoutSuccess";

import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import TechProductList from "./components/product/techProductList/techProductList";
import ModaProductList from "./components/product/modaProductList/modaProductList";
import BolsosProductList from "./components/product/bolsosProductList/bolsosProductList";
import HogarProductList from "./components/product/hogarProductList/HogarProductList";
import CategoryPage from "./components/product/CategoryPage";

import ProductList from "./components/product/ProductList";
import ProductDetail from "./components/product/ProductDetail";
import Cart from "./components/cart/Cart";
import Checkout from "./components/checkout/Checkout";

import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductContext";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import PromoBar from "./components/PromoBar";
import Terminos from "./components/legales/Terminos";
import Privacidad from "./components/legales/Privacidad";
import Garantias from "./components/legales/Garantias";
import Envios from "./components/legales/Envios";
import AvisoLegal from "./components/legales/AvisoLegal";
import Cookies from "./components/legales/Cookies";
import { ConsentProvider } from "./consent/ConsentContext";
import CookieConsent from "./consent/CookieConsent";

import "./App.css";

const App = () => {
  return (
    <HelmetProvider>
      <ConsentProvider>
        <AuthProvider>
          <CartProvider>
            <ProductsProvider>
            <div className="App">
              <ScrollToTop />
              <MetaPageView />
              <PromoBar />
              <Navbar />
              <div className="App-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/moda" element={<CategoryPage><ModaProductList /></CategoryPage>} />
                  <Route path="/bolsos" element={<CategoryPage><BolsosProductList /></CategoryPage>} />
                  <Route path="/tecnologia" element={<CategoryPage><TechProductList /></CategoryPage>} />
                  <Route path="/hogar" element={<CategoryPage><HogarProductList /></CategoryPage>} />
                  
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:category/:productId" element={<ProductDetail />} />
                  <Route path="/products/:productId" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout-success" element={<CheckoutSuccess />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="/garantias" element={<Garantias />} />
                  <Route path="/envios" element={<Envios />} />
                  <Route path="/aviso-legal" element={<AvisoLegal />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />

                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth role="admin">
                        <Dashboard />
                      </RequireAuth>
                    }
                  />
                </Routes>
              </div>
              <Footer />
              <CookieConsent />
            </div>
            </ProductsProvider>
          </CartProvider>
        </AuthProvider>
      </ConsentProvider>
    </HelmetProvider>
  );
};

export default App;
