import React, { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  // 🔹 Cálculo del total con los nuevos campos (en inglés)
  const total = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
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
                    <strong>{item.name || "Producto sin nombre"}</strong>

                    <p style={{ margin: "4px 0" }}>
                      Precio: $
                      {item.price_cop
                        ? Number(item.price_cop).toLocaleString("es-CO")
                        : "N/A"}
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
                        onClick={() =>
                          updateQuantity(item.id, (item.quantity || 1) + 1)
                        }
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

                  {/* 🔸 Imagen del producto */}
                  {item.images && item.images.length > 0 && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* 🔹 Total */}
          <h4 className="right-align">
            Total: ${total.toLocaleString("es-CO")}
          </h4>

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
