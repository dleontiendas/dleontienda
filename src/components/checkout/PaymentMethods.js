import React from "react";

export default function PaymentMethods({
  payment,
}) {
  const {
    paymentMethod,
    setPaymentMethod,
    wompiType,
    setWompiType,
    boldType,
    setBoldType,
  } = payment;

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleWompiChange = (e) => {
    setWompiType(e.target.value);
  };

  const handleBoldChange = (e) => {
    setBoldType(e.target.value);
  };

  return (
    <section className="checkout-card">
      <div className="checkout-card-header">
        <span className="checkout-icon">💳</span>

        <div>
          <h2>Método de pago</h2>

          <p>
            Selecciona la forma de pago que prefieras.
          </p>
        </div>
      </div>

      <div className="payment-options">

        <label className="payment-option">
          <input
            type="radio"
            value="contraentrega"
            checked={paymentMethod === "contraentrega"}
            onChange={handlePaymentChange}
          />

          <span>Pago contra entrega</span>
        </label>

        <label className="payment-option">
          <input
            type="radio"
            value="addi"
            checked={paymentMethod === "addi"}
            onChange={handlePaymentChange}
          />

          <span>Financiación con Addi</span>
        </label>

        <label className="payment-option">
          <input
            type="radio"
            value="sistecredito"
            checked={paymentMethod === "sistecredito"}
            onChange={handlePaymentChange}
          />

          <span>Financiación con Sistecrédito</span>
        </label>

        <label className="payment-option">
          <input
            type="radio"
            value="wompi"
            checked={paymentMethod === "wompi"}
            onChange={handlePaymentChange}
          />

          <span>Pago con Wompi</span>
        </label>

        {paymentMethod === "wompi" && (
          <div className="payment-suboptions">

            {[
              ["CARD", "Tarjeta"],
              ["PSE", "PSE"],
              ["NEQUI", "Nequi"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="payment-option"
              >
                <input
                  type="radio"
                  value={value}
                  checked={wompiType === value}
                  onChange={handleWompiChange}
                />

                <span>{label}</span>
              </label>
            ))}

          </div>
        )}

        <label className="payment-option">
          <input
            type="radio"
            value="bold"
            checked={paymentMethod === "bold"}
            onChange={handlePaymentChange}
          />

          <span>Pago con Bold</span>
        </label>

        {paymentMethod === "bold" && (
          <div className="payment-suboptions">

            {[
              ["CARD", "Tarjeta"],
              ["PSE", "PSE"],
              ["NEQUI", "Nequi"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="payment-option"
              >
                <input
                  type="radio"
                  value={value}
                  checked={boldType === value}
                  onChange={handleBoldChange}
                />

                <span>{label}</span>
              </label>
            ))}

          </div>
        )}

      </div>
    </section>
  );
}