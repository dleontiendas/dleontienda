import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Checkout.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);

  const [shipping] = useState(15900);
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

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
    0
  );
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return alert("Tu carrito está vacío");

    setLoading(true);

    try {
      const order = {
        customer: formData,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price_cop,
          quantity: item.quantity,
          color: item.selectedColor,
          size: item.selectedSize,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod,
        status: "INITIATED",
        createdAt: serverTimestamp(),
      };

      // 1️⃣ Guardar orden en Firestore
      const docRef = await addDoc(collection(db, "orders"), order);

      // 2️⃣ FLUJOS DE PAGO
      if (paymentMethod === "contraentrega") {
        alert("Tu pedido fue creado. Pagarás al recibirlo 🚚");
        clearCart();
        return;
      }

      if (paymentMethod === "addi") {
        // 3️⃣ Llamar a tu backend ADDI
        const res = await fetch(`${API_URL}/api/payments/addi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: docRef.id,
            total,
            email: formData.email,
            phone: formData.phone,
            document: formData.document,
            firstName: formData.first_name,
            lastName: formData.last_name,
          }),
        });

        const data = await res.json();

        if (!data.redirectUrl) {
          throw new Error("No se recibió redirectUrl de ADDI");
        }

        // 4️⃣ Redirigir a ADDI
        window.location.href = data.redirectUrl;
        return;
      }

      alert("Método de pago no soportado aún");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("❌ Error al procesar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== WHATSAPP ===================== */

  const handleWhatsAppOrder = () => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
    const message = encodeURIComponent(
      `*Nuevo pedido*\n\n` +
        `${formData.first_name} ${formData.last_name}\n${formData.email}\n${formData.phone}\n${formData.address}, ${formData.city}\n\n` +
        cart
          .map(
            (item) =>
              `• ${item.name} (${item.selectedColor || "N/A"} / ${
                item.selectedSize || "N/A"
              }) x${item.quantity} — $${Number(
                item.price_cop
              ).toLocaleString("es-CO")}`
          )
          .join("\n") +
        `\n\nSubtotal: $${subtotal.toLocaleString("es-CO")}` +
        `\nEnvío: $${shipping.toLocaleString("es-CO")}` +
        `\n*Total: $${total.toLocaleString("es-CO")}*`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="checkout-page">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <h3>Datos del comprador</h3>

        <label>Correo electrónico</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="checkout-row">
          <div>
            <label>Nombre</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Apellidos</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <label>Cédula o NIT</label>
        <input
          type="text"
          name="document"
          value={formData.document}
          onChange={handleChange}
          required
        />

        <label>Dirección</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <div className="checkout-row">
          <div>
            <label>Ciudad</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Departamento</label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={handleChange}
            />
          </div>
        </div>

        <label>Teléfono</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <div className="payment-section">
          <h4>Método de pago</h4>

          <label className="radio-option">
            <input
              type="radio"
              value="contraentrega"
              checked={paymentMethod === "contraentrega"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Pago contra entrega 🚚
          </label>

          <label className="radio-option">
            <input
              type="radio"
              value="addi"
              checked={paymentMethod === "addi"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Financiación con ADDI 🛍️
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Procesando..." : "Finalizar compra"}
        </button>
      </form>

      <div className="checkout-summary">
        <h3>Resumen del Pedido</h3>

        <ul>
          {cart.map((item, index) => (
            <li key={index}>
              <span>
                {item.name} x{item.quantity || 1}
              </span>
              <span>
                ${Number(item.price_cop).toLocaleString("es-CO")}
              </span>
            </li>
          ))}
        </ul>

        <hr />
        <p>
          Subtotal: <strong>${subtotal.toLocaleString("es-CO")}</strong>
        </p>
        <p>
          Envío: <strong>${shipping.toLocaleString("es-CO")}</strong>
        </p>
        <h4>Total: ${total.toLocaleString("es-CO")}</h4>

        <button
          type="button"
          className="btn-whatsapp"
          onClick={handleWhatsAppOrder}
        >
          Comprar por WhatsApp 💬
        </button>
      </div>
    </div>
  );
};

export default Checkout;
