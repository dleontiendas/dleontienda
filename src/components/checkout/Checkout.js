import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Checkout.css";

const API_URL = "https://dleongold.com:3001" || "";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);

  const [shipping] = useState(15900);
  const [paymentMethod, setPaymentMethod] = useState("contraentrega");
const [wompiType, setWompiType] = useState("PSE"); // PSE | CARD | NEQUI
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
        alert("Tu pedido fue creado. Pagarás al recibirlo ");
        clearCart();
        return;
      }


      if (paymentMethod === "wompi") {
  const res = await fetch(`${API_URL}/api/payments/wompi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: docRef.id,
      total,
      wompiType, // PSE | CARD | NEQUI
      customer: formData,
    }),
  });

  const data = await res.json();
  window.location.href = data.redirectUrl;
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
      alert(" Error al procesar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== WHATSAPP ===================== */

  const handleWhatsAppOrder = () => {
    const phoneNumber = "573104173201";
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

  {/* CONTRAENTREGA */}
  <div
    className={`payment-card ${
      paymentMethod === "contraentrega" ? "active" : ""
    }`}
    onClick={() => setPaymentMethod("contraentrega")}
  >
    <input
      type="radio"
      checked={paymentMethod === "contraentrega"}
      readOnly
    />
    <div>
      <strong>Pago contra entrega</strong>
      <p>Paga cuando recibas tu pedido</p>
    </div>
  </div>

  {/* ADDI */}
  <div
    className={`payment-card ${paymentMethod === "addi" ? "active" : ""}`}
    onClick={() => setPaymentMethod("addi")}
  >
    <input type="radio" checked={paymentMethod === "addi"} readOnly />
    <div>
      <strong>Financiación con ADDI</strong>
      <p>Paga a cuotas sin tarjeta</p>
    </div>
  </div>

  {/* WOMPI 
  <div
    className={`payment-card ${paymentMethod === "wompi" ? "active" : ""}`}
    onClick={() => setPaymentMethod("wompi")}
  >
    <input type="radio" checked={paymentMethod === "wompi"} readOnly />
    <div>
      <strong>Pago electrónico (Wompi)</strong>
      <p>PSE, Tarjeta o Nequi</p>

      {paymentMethod === "wompi" && (
        <div className="sub-options">
          <label>
            <input
              type="radio"
              checked={wompiType === "PSE"}
              onChange={() => setWompiType("PSE")}
            />
            PSE 
          </label>

          <label>
            <input
              type="radio"
              checked={wompiType === "CARD"}
              onChange={() => setWompiType("CARD")}
            />
            Tarjeta 
          </label>

          <label>
            <input
              type="radio"
              checked={wompiType === "NEQUI"}
              onChange={() => setWompiType("NEQUI")}
            />
            Nequi 
          </label>
        </div>
      )}
    </div>
  </div>*/}
</div>

        
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
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Procesando..." : "Finalizar compra"}
        </button>
        <button
          type="button"
          className="btn-whatsapp"
          onClick={handleWhatsAppOrder}
        >
          Comprar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default Checkout;
