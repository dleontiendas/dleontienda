import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [shipping, setShipping] = useState(15900);
  const [paymentMethod, setPaymentMethod] = useState("contraentrega");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    document: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
  });

  // 🔹 Totales con nueva estructura
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
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
      const order = {
        customer: formData,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price_cop,
          quantity: item.quantity,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod,
        status: paymentMethod === "contraentrega" ? "Pending" : "Paid",
        date: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), order);

      clearCart?.();
      alert(`✅ Pedido creado con éxito. ID: ${docRef.id}`);

      if (paymentMethod === "contraentrega") {
        alert("Tu pedido será enviado y pagado al recibirlo. ");
      } else {
        alert("Aquí iría la integración con la pasarela de pago ");
      }

      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        document: "",
        address: "",
        city: "",
        province: "",
        postal_code: "",
        phone: "",
      });
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      alert("❌ Error al crear el pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Enviar mensaje por WhatsApp
  const handleWhatsAppOrder = () => {
    const phoneNumber = "573104173201"; // 📞 Cambia este número por el tuyo (formato internacional)
    const message = encodeURIComponent(
      ` *Nuevo pedido desde la tienda DLEON GOLD*\n\n` +
        ` *Cliente:*\n${formData.first_name} ${formData.last_name}\n📧 ${formData.email}\n ${formData.phone}\n ${formData.address}, ${formData.city}, ${formData.province}\n ${formData.document}\n\n` +
        ` *Productos:*\n` +
        cart
          .map(
            (item) =>
              `• ${item.name} (${item.selectedColor || "N/A"} / ${
                item.selectedSize || "N/A"
              }) x${item.quantity} — $${Number(item.price_cop).toLocaleString()}`
          )
          .join("\n") +
        `\n\n *Subtotal:* $${subtotal.toLocaleString()}\n *Envío:* $${shipping.toLocaleString()}\n *Total:* $${total.toLocaleString()}\n\n` +
        ` *Método de pago:* ${
          paymentMethod === "contraentrega"
            ? "Pago contra entrega"
            : "Pasarela de pago"
        }`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        padding: "2rem",
        background: "#f9f9f9",
        fontFamily: "Arial, sans-serif",
        flexWrap: "wrap",
      }}
    >
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 2,
          minWidth: "320px",
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
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            name="first_name"
            placeholder="Nombre"
            value={formData.first_name}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="text"
            name="last_name"
            placeholder="Apellidos"
            value={formData.last_name}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <input
          type="text"
          name="document"
          placeholder="Cédula o NIT"
          value={formData.document}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="address"
          placeholder="Dirección"
          value={formData.address}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="city"
          placeholder="Ciudad"
          value={formData.city}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="province"
          placeholder="Provincia/Estado"
          value={formData.province}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="postal_code"
          placeholder="Código Postal"
          value={formData.postal_code}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="phone"
          placeholder="Teléfono"
          value={formData.phone}
          onChange={handleChange}
          style={styles.input}
        />

        <h4 style={{ margin: "1rem 0 0.5rem" }}>Método de envío</h4>
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
          style={styles.buttonPrimary}
        >
          {loading ? "Procesando..." : "Pagar ahora"}
        </button>

        <button
          type="button"
          onClick={handleWhatsAppOrder}
          style={styles.buttonWpp}
        >
          🟢 Comprar por WhatsApp
        </button>
      </form>

      {/* Resumen */}
      <div
        style={{
          flex: 1,
          minWidth: "300px",
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
                {item.name} x{item.quantity || 1}
              </span>
              <span>${Number(item.price_cop).toLocaleString()}</span>
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
  buttonPrimary: {
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
  },
  buttonWpp: {
    background: "#25d366",
    color: "#fff",
    border: "none",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    marginTop: "0.75rem",
  },
};

export default Checkout;
