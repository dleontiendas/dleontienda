import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { resolveProductPricing } from "../components/utils/productPricing";

export const CartContext = createContext();

export const CartProvider = ({
  children,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState(() => {
    try { return localStorage.getItem("cartDeliveryMethod") === "pickup" ? "pickup" : "delivery"; }
    catch { return "delivery"; }
  });
  useEffect(() => {
    try { localStorage.setItem("cartDeliveryMethod", deliveryMethod); } catch { /* Storage may be unavailable. */ }
  }, [deliveryMethod]);
  const [cart, setCart] = useState(() => {
    try {
      const saved =
        localStorage.getItem("cart");

      return saved
        ? JSON.parse(saved)
        : [];
    } catch (error) {
      console.error(
        "Error cargando carrito:",
        error
      );
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (
    product,
    quantity = 1,
    selectedSize = null,
    selectedColor = null
  ) => {
    const safeQuantity =
      Math.max(
        1,
        Number(quantity) || 1
      );

    const pricing = resolveProductPricing(product, selectedColor, selectedSize);
    const pricedProduct = { ...product, price_cop: pricing.price, oldPrice: pricing.oldPrice };

    setCart((prevCart) => {
      const existing =
        prevCart.find(
          (item) =>
            item.id === product.id &&
            item.selectedSize ===
              selectedSize &&
            item.selectedColor ===
              selectedColor
        );

      if (existing) {
        return prevCart.map(
          (item) =>
            item.id === product.id &&
            item.selectedSize ===
              selectedSize &&
            item.selectedColor ===
              selectedColor
              ? {
                  ...item,
                  ...pricedProduct,
                  quantity:
                    item.quantity +
                    safeQuantity,
                  selectedSize,
                  selectedColor,
                }
              : item
        );
      }

      return [
        ...prevCart,
        {
          ...pricedProduct,
          quantity:
            safeQuantity,
          selectedSize,
          selectedColor,
        },
      ];
    });
  };

  const removeFromCart = (
    id,
    selectedSize = null,
    selectedColor = null
  ) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.id === id &&
            item.selectedSize ===
              selectedSize &&
            item.selectedColor ===
              selectedColor
          )
      )
    );
  };

  const updateQuantity = (
  id,
  selectedSize = null,
  selectedColor = null,
  quantity
) => {
  const safeQuantity = Math.max(1, Number(quantity) || 1);

  setCart((prevCart) =>
    prevCart.map((item) =>
      item.id === id &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
        ? {
            ...item,
            quantity: safeQuantity,
          }
        : item
    )
  );
};

  const clearCart = () => {
    setCart([]);
    setDeliveryMethod("delivery");
  };

  const getCartItem = (
    id,
    selectedSize = null,
    selectedColor = null
  ) => {
    return cart.find(
      (item) =>
        item.id === id &&
        item.selectedSize ===
          selectedSize &&
        item.selectedColor ===
          selectedColor
    );
  };

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (acc, item) =>
          acc +
          (item.quantity || 0),
        0
      ),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) =>
          acc +
          (item.price_cop || 0) *
            (item.quantity || 1),
        0
      ),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      totalItems,
      subtotal,
      deliveryMethod,
      setDeliveryMethod,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartItem,
      clearCart,
    }),
    [cart, totalItems, subtotal, deliveryMethod]
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
