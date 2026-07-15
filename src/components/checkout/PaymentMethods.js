import React from "react";

const providers = [
  {
    id: "addi",
    title: "Addi",
    description: "Compra ahora y paga a cuotas.",
    icon: "/images/providers/addi-com-logo.png",
    enabled: false,
  },
  {
    id: "wompi",
    title: "Wompi",
    description: "Tarjetas, PSE, Nequi y más.",
    icon: "/images/providers/wompi-com-logo.png",
    enabled: false,
  },
  {
    id: "bold",
    title: "Bold",
    description: "Tarjetas, PSE y billeteras digitales.",
    icon: "/images/providers/bold-logo.png",
    enabled: false,
  },
  {
    id: "sistecredito",
    title: "Sistecrédito",
    description: "Financia tu compra fácilmente.",
    icon: "/images/providers/sistecredito-com-logo.png",
    enabled: false,
  },
];

export default function PaymentMethods({ payment }) {
  const { paymentMethod, setPaymentMethod } = payment;

  return (
    <section className="checkout-card">
      <div className="checkout-card-header">
        <span className="checkout-icon">💳</span>

        <div>
          <h2>Método de pago</h2>

          <p>Selecciona el proveedor con el que deseas finalizar tu compra.</p>
        </div>
      </div>

      <div className="payment-grid">
        {providers.map((provider) => (
          <label
            key={provider.id}
            className={`payment-card ${
              paymentMethod === provider.id ? "active" : ""
            } ${!provider.enabled ? "disabled" : ""}`}
          >
            <input
              type="radio"
              name="payment"
              value={provider.id}
              checked={paymentMethod === provider.id}
              disabled={!provider.enabled}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />

            

            <div className="payment-icon">
              <img src={provider.icon} alt={provider.title} loading="lazy" />
            </div>

            <div className="payment-info">
              <h3>{provider.title}</h3>

              <p>{provider.description}</p>
            </div>
          </label>
          
        ))}
      </div>
    </section>
  );
}
