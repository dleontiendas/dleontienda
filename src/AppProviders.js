// src/AppProviders.jsx

import React from "react";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import {
  ProductsProvider
} from "./context/ProductContext";

export default function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}