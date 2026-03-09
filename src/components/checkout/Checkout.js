import React, { useContext, useState, useEffect } from "react";
import { CartContext } from "../../context/CartContext";
import { db } from "../../Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import M from "materialize-css";
import "./Checkout.css";

const API_URL = "https://dleongold.com:3001";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [shipping] = useState(15900);
  const [paymentMethod, setPaymentMethod] = useState("contraentrega");
  const [wompiType, setWompiType] = useState("PSE");
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

  useEffect(() => {
    M.AutoInit();
  }, []);

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
    0
  );

  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    console.log("Checkout iniciado");

    if (!cart.length) {
      M.toast({ html: "Tu carrito está vacío" });
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
          color: item.selectedColor,
          size: item.selectedSize,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod,
        wompiType,
        status: "INITIATED",
        createdAt: serverTimestamp(),
      };

      console.log("Guardando orden:", order);

      const docRef = await addDoc(collection(db, "orders"), order);

      console.log("Orden creada:", docRef.id);

      /* CONTRAENTREGA */

      if (paymentMethod === "contraentrega") {
        clearCart();
        navigate(`/checkout-success?ref=${docRef.id}`);
        return;
      }

      /* WOMPI */

      if (paymentMethod === "wompi") {
        const res = await fetch(`${API_URL}/api/payments/wompi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: docRef.id,
            total,
            wompiType,
            customer: formData,
          }),
        });

        const data = await res.json();

        if (!data.redirectUrl) {
          throw new Error("Wompi no devolvió redirectUrl");
        }

        window.location.href = data.redirectUrl;
        return;
      }

      /* ADDI */

      if (paymentMethod === "addi") {
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
          throw new Error("Addi no devolvió redirectUrl");
        }

        window.location.href = data.redirectUrl;
        return;
      }
    } catch (error) {
      console.error("Error checkout:", error);
      M.toast({ html: "Error procesando el pago" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= WHATSAPP ================= */

  const handleWhatsAppOrder = () => {
    const phoneNumber = "573104173201";

    const message = encodeURIComponent(
      `Nuevo pedido\n\n` +
        `${formData.first_name} ${formData.last_name}\n${formData.email}\n${formData.phone}\n${formData.address}, ${formData.city}\n\n` +
        cart
          .map(
            (item) =>
              `• ${item.name} x${item.quantity} - $${Number(
                item.price_cop
              ).toLocaleString("es-CO")}`
          )
          .join("\n") +
        `\n\nTotal: $${total.toLocaleString("es-CO")}`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="checkout-page">

      <div className="checkout-form">
        <h3>Datos del comprador</h3>

        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <div className="checkout-row">
          <div>
            <label>Nombre</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>

          <div>
            <label>Apellidos</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
          </div>
        </div>

        <label>Cédula</label>
        <input type="text" name="document" value={formData.document} onChange={handleChange} required />

        <label>Dirección</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} required />

        <div className="checkout-row">
          <div>
            <label>Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>

          <div>
            <label>Departamento</label>
            <input type="text" name="province" value={formData.province} onChange={handleChange} />
          </div>
        </div>

        <label>Teléfono</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />

        <div className="payment-section">
          <h4>Método de pago</h4>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="contraentrega" checked={paymentMethod === "contraentrega"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Pago contra entrega</span>
            </label>
          </p>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="addi" checked={paymentMethod === "addi"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Financiación con ADDI</span>
            </label>
          </p>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="wompi" checked={paymentMethod === "wompi"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Pago electrónico (Wompi)</span>
            </label>
          </p>

          {paymentMethod === "wompi" && (
            <div style={{ marginLeft: "25px", marginTop: "10px" }}>
              <p>
                <label>
                  <input name="wompiType" type="radio" value="PSE" checked={wompiType === "PSE"} onChange={(e) => setWompiType(e.target.value)} />
                  <span>PSE</span>
                </label>
              </p>

              <p>
                <label>
                  <input name="wompiType" type="radio" value="CARD" checked={wompiType === "CARD"} onChange={(e) => setWompiType(e.target.value)} />
                  <span>Tarjeta</span>
                </label>
              </p>

              <p>
                <label>
                  <input name="wompiType" type="radio" value="NEQUI" checked={wompiType === "NEQUI"} onChange={(e) => setWompiType(e.target.value)} />
                  <span>Nequi</span>
                </label>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="checkout-summary">
        <h3>Resumen del Pedido</h3>

        <ul>
          {cart.map((item, i) => (
            <li key={i}>
              <span>{item.name} x{item.quantity}</span>
              <span>${Number(item.price_cop).toLocaleString("es-CO")}</span>
            </li>
          ))}
        </ul>

        <hr />

        <p>Subtotal <strong>${subtotal.toLocaleString("es-CO")}</strong></p>
        <p>Envío <strong>${shipping.toLocaleString("es-CO")}</strong></p>

        <h4>Total ${total.toLocaleString("es-CO")}</h4>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
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