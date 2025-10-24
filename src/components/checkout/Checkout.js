import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Checkout.css";

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
      alert(` Pedido creado con éxito. ID: ${docRef.id}`);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      alert(" Error al crear el pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber = process.env.REACT_APP_WHATSAPP_NUMBER;
    const message = encodeURIComponent(
      ` *Nuevo pedido desde D'LEON GOLD*\n\n` +
        ` ${formData.first_name} ${formData.last_name}\n ${formData.email}\n ${formData.phone}\n ${formData.address}, ${formData.city}\n\n` +
        cart
          .map(
            (item) =>
              `• ${item.name} (${item.selectedColor || "N/A"} / ${
                item.selectedSize || "N/A"
              }) x${item.quantity} — $${Number(item.price_cop).toLocaleString()}`
          )
          .join("\n") +
        `\n\nSubtotal: $${subtotal.toLocaleString()}\nEnvío: $${shipping.toLocaleString()}\n*Total: $${total.toLocaleString()}*`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

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
            <label>Provincia / Departamento</label>
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

        <div className="shipping-section">
          <h4>Método de envío</h4>
          <label className="radio-option">
            <input type="radio" name="envio" checked readOnly />
            Envío express a toda Colombia —{" "}
            <strong>${shipping.toLocaleString()}</strong>
          </label>
        </div>

        <div className="payment-section">
          <h4>Método de pago</h4>
          <label className="radio-option">
            <input
              type="radio"
              name="metodoPago"
              value="contraentrega"
              checked={paymentMethod === "contraentrega"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Pago contra entrega 
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="metodoPago"
              value="tarjeta"
              checked={paymentMethod === "tarjeta"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Tarjeta / Pasarela de pago 💳
          </label>
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
              <span>${Number(item.price_cop).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <hr />
        <p>
          Subtotal: <strong>${subtotal.toLocaleString()}</strong>
        </p>
        <p>
          Envío: <strong>${shipping.toLocaleString()}</strong>
        </p>
        <h4>Total: ${total.toLocaleString()}</h4>

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
