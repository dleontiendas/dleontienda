// src/components/Cart.js
import React, { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (acc, item) => acc + (item["Precio (COL)"] || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="container">
      <h2 className="center-align">Carrito</h2>

      {cart.length === 0 ? (
        <p className="center-align">Tu carrito está vacío</p>
      ) : (
        <>
          <ul className="collection">
            {cart.map((item, index) => (
              <li className="collection-item" key={`${item.id}-${index}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong>{item.nombre}</strong>
                    <p style={{ margin: "4px 0" }}>
                      Precio: ${item["Precio (COL)"] ? Number(item["Precio (COL)"]).toFixed(2) : "N/A"}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      Cantidad: 
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max((item.quantity || 1) - 1, 1))
                        }
                        className="btn-small orange"
                        style={{ margin: "0 6px" }}
                      >
                        -
                      </button>
                      {item.quantity || 1}
                      <button
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="btn-small orange"
                        style={{ margin: "0 6px" }}
                      >
                        +
                      </button>
                    </p>
                    {item.selectedSize && (
                      <p style={{ margin: "4px 0" }}>Talla: {item.selectedSize}</p>
                    )}
                    {item.selectedColor && (
                      <p style={{ margin: "4px 0" }}>Color: {item.selectedColor}</p>
                    )}
                    <button
                      className="btn-small red"
                      onClick={() => removeFromCart(item.id)}
                      style={{ marginTop: "6px" }}
                    >
                      Quitar
                    </button>
                  </div>
                  {item.imagen && (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <h4 className="right-align">Total: ${total.toFixed(2)}</h4>

          <button
            className="btn waves-effect waves-light"
            onClick={() => navigate("/checkout")}
          >
            Proceder al Pago
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;
