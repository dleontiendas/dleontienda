import React, { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
    0
  );

  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  if (cart.length === 0)
    return (
      <div className="cart-container center">
        <h5>Tu carrito está vacío 🛒</h5>
      </div>
    );

  return (
    <div className="cart-page container">
      <h4 className="cart-title center-align">Carrito de compras</h4>

      <div className="cart-content">
        {/* 🧾 Lista de productos */}
        <div className="cart-products">
          <div className="cart-card">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-left">
                  <img
                    src={
                      (item.images && item.images[0]) ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-brand">{item.brand || "Producto"}</p>
                    <p className="cart-item-name">{item.name}</p>
                    {item.selectedColor && (
                      <p className="cart-variant">Color: {item.selectedColor}</p>
                    )}
                    {item.selectedSize && (
                      <p className="cart-variant">Talla: {item.selectedSize}</p>
                    )}
                  </div>
                </div>

                <div className="cart-item-right">
                  <p className="cart-item-price">
                    ${Number(item.price_cop).toLocaleString("es-CO")}
                  </p>

                  <div className="cart-qty-control">
                    <button
                      className="qty-btn"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max((item.quantity || 1) - 1, 1)
                        )
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button
                      className="qty-btn"
                      onClick={() =>
                        updateQuantity(item.id, (item.quantity || 1) + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 💰 Resumen lateral */}
        <div className="cart-summary">
          <div className="summary-card">
            <h6>Resumen de compra</h6>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="summary-row discount">
              <span>Descuento:</span>
              <span>- ${discount.toLocaleString("es-CO")}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </div>

            <button
              className="btn orange darken-2 w-100"
              onClick={() => navigate("/checkout")}
            >
              Ir a pagar 
            </button>

            <button
              className="btn-flat blue-text w-100"
              onClick={() => navigate("/")}
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
