// src/components/Checkout.js
import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [shipping, setShipping] = useState(15900);
  const [paymentMethod, setPaymentMethod] = useState("contraentrega"); // 🔹 Nuevo estado
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    documento: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    telefono: "",
  });

  const subtotal = cart.reduce(
    (acc, item) => acc + (item["Precio (COL)"] || 0) * (item.quantity || 1),
    0
  );
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      alert("Tu carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const pedido = {
        cliente: formData,
        items: cart.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          precio: item["Precio (COL)"],
          cantidad: item.quantity,
        })),
        subtotal,
        envio: shipping,
        total,
        metodoPago: paymentMethod,
        estado: paymentMethod === "contraentrega" ? "Pendiente" : "Pagado",
        fecha: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "pedidos"), pedido);

      clearCart?.();
      alert(`✅ Pedido creado con éxito. ID: ${docRef.id}`);

      if (paymentMethod === "contraentrega") {
        alert("Tu pedido será enviado y pagado al recibirlo. 🚚");
      } else {
        alert("Aquí iría la integración con la pasarela de pago (PayU, Stripe, etc.)");
      }

      setFormData({
        email: "",
        nombre: "",
        apellido: "",
        documento: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        telefono: "",
      });
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      alert("❌ Error al crear el pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        padding: "2rem",
        background: "#f9f9f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 2,
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "1rem", color: "#333" }}>Checkout</h3>

        <h4 style={{ margin: "1rem 0 0.5rem" }}>Contacto</h4>
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <h4 style={{ margin: "1rem 0 0.5rem" }}>Entrega</h4>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellidos"
            value={formData.apellido}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <input
          type="text"
          name="documento"
          placeholder="Cédula o NIT"
          value={formData.documento}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={formData.direccion}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="ciudad"
          placeholder="Ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="provincia"
          placeholder="Provincia/Estado"
          value={formData.provincia}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="codigoPostal"
          placeholder="Código Postal"
          value={formData.codigoPostal}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
          style={styles.input}
        />

        <h4 style={{ margin: "1rem 0 0.5rem" }}>Métodos de envío</h4>
        <label style={styles.radioLabel}>
          <input type="radio" name="envio" checked readOnly />
          Envío express a toda Colombia (1-2 días) —{" "}
          <strong>${shipping.toLocaleString()}</strong>
        </label>

        <h4 style={{ margin: "1rem 0 0.5rem" }}>Método de pago</h4>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="metodoPago"
            value="contraentrega"
            checked={paymentMethod === "contraentrega"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Pago contra entrega 💵
        </label>
        <label style={styles.radioLabel}>
          <input
            type="radio"
            name="metodoPago"
            value="tarjeta"
            checked={paymentMethod === "tarjeta"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Tarjeta / Pasarela de pago 💳
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#ff6f00",
            color: "#fff",
            border: "none",
            padding: "0.75rem",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            marginTop: "1rem",
            transition: "0.3s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Procesando..." : "Pagar ahora"}
        </button>
      </form>

      {/* Resumen */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          height: "fit-content",
        }}
      >
        <h4>Resumen del Pedido</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {cart.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span>
                {item.nombre} x{item.quantity || 1}
              </span>
              <span>${Number(item["Precio (COL)"]).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <hr />
        <p style={styles.summaryText}>
          Subtotal: <strong>${subtotal.toLocaleString()}</strong>
        </p>
        <p style={styles.summaryText}>
          Envío: <strong>${shipping.toLocaleString()}</strong>
        </p>
        <h5 style={{ marginTop: "1rem", color: "#222" }}>
          Total: ${total.toLocaleString()}
        </h5>
      </div>
    </div>
  );
};

const styles = {
  input: {
    width: "100%",
    padding: "0.75rem",
    margin: "0.5rem 0",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "0.2s",
  },
  summaryText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#555",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    background: "#f3f3f3",
    borderRadius: "8px",
    marginBottom: "0.5rem",
  },
};

export default Checkout;
