import React, { useContext } from "react";
import { getDeliveryCost } from "./delivery";
import { Truck, Store, Info, ReceiptText, Trash2, ArrowRight } from "lucide-react";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { getSelectedProductImage } from "../utils/productImage";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, deliveryMethod, setDeliveryMethod } =
    useContext(CartContext);
  const navigate = useNavigate();
  const shipping = getDeliveryCost(deliveryMethod);

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
    0,
  );

  const discount = subtotal * 0; //0.1; // Ejemplo: 10% de descuento
  const total = subtotal - discount + shipping;

  if (cart.length === 0)
    return (
      <div className="cart-container center">
        <h5>Tu carrito está vacío 🛒</h5>
      </div>
    );

  return (
    <div className="cart-page container">
      <h1 className="cart-title">Carrito de compras</h1>
      <p className="cart-intro">Revisa tus productos y elige cómo quieres recibir tu pedido.</p>

      <div className="cart-content">
        {/*  Lista de productos */}
        <div className="cart-products">
          <div className="cart-card">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-left">
                  <img
                    src={
                      getSelectedProductImage(item, item.selectedColor) ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-brand">
                      {item.brand || "Producto"}
                    </p>
                    <p className="cart-item-name">{item.name}</p>
                    {item.selectedColor && (
                      <p className="cart-variant">
                        Color: {item.selectedColor}
                      </p>
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
                      aria-label={`Reducir cantidad de ${item.name}`}
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.selectedSize,
                          item.selectedColor,
                          Math.max((item.quantity || 1) - 1, 1),
                        )
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button
                      className="qty-btn"
                      aria-label={`Aumentar cantidad de ${item.name}`}
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.selectedSize,
                          item.selectedColor,
                          (item.quantity || 1) + 1,
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    aria-label={`Eliminar ${item.name}`}
                    onClick={() =>
                      removeFromCart(
                        item.id,
                        item.selectedSize,
                        item.selectedColor,
                      )
                    }
                  >
                    <Trash2 size={21} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <fieldset className="cart-delivery">
            <legend>¿Cómo quieres recibir tu pedido?</legend>
            <p>Selecciona la opción que más te convenga.</p>
            <div className="cart-delivery-options">
              <label className={`cart-delivery-option ${deliveryMethod === "delivery" ? "is-selected" : ""}`}>
                <input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} />
                <Truck aria-hidden="true" />
                <span><strong>Envío a domicilio</strong><span>$10.000 para el código postal 052810; $25.000 para el resto del país. Se ajusta al ingresar el destino al pagar.</span></span>
              </label>
              <label className={`cart-delivery-option ${deliveryMethod === "pickup" ? "is-selected" : ""}`}>
                <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} />
                <Store aria-hidden="true" />
                <span><strong>Recoger en tienda</strong><span>Gratis en D’LEON GOLD – Cra 49 #48-31, Segovia.</span></span>
              </label>
            </div>
            <p className="cart-delivery-note"><Info size={18} aria-hidden="true" />Si eliges recoger en tienda no se cobra envío.</p>
          </fieldset>
        </div>

        {/*  Resumen lateral */}
        <div className="cart-summary">
          <div className="summary-card">
            <h2><ReceiptText size={23} aria-hidden="true" /> Resumen de compra</h2>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="summary-row discount">
              <span>Descuento:</span>
              <span>- ${discount.toLocaleString("es-CO")}</span>
            </div>
            <div className="summary-row cart-delivery-summary"><span>Método de entrega:</span><strong>{deliveryMethod === "pickup" ? "Recoger en tienda" : "Envío a domicilio"}</strong></div>
            <div className="summary-row"><span>{deliveryMethod === "pickup" ? "Recogida en tienda:" : "Costo de envío:"}</span><strong>${shipping.toLocaleString("es-CO")}</strong></div>
            <div className="summary-total" aria-live="polite">
              <span>Total:</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </div>

            <button
              className="btn cart-checkout-btn w-100"
              onClick={() => navigate("/checkout")}
            >
              IR A PAGAR <ArrowRight size={20} aria-hidden="true" />
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
