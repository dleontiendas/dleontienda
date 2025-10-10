// context/CartContext.js
import React, { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (
    product,
    quantity = 1,
    selectedSize = null,
    selectedColor = null
  ) => {
    const existing = cart.find(
      (item) =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
    );

    if (existing) {
      // Si ya existe el mismo producto con talla y color, solo suma la cantidad
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // Si no existe, lo agrega como nuevo
      const newItem = {
        ...product,
        quantity,
        selectedSize,
        selectedColor,
      };
      setCart((prevCart) => [...prevCart, newItem]);
    }
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
export default CartProvider;