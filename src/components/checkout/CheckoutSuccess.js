import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./CheckoutSuccess.css";

const API_URL = "https://dleongold.com:3001";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const orderId = params.get("ref");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/payments/validate?orderId=${orderId}`
        );

        const data = await res.json();

        if (data.status === "APPROVED") {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [orderId]);

  if (status === "loading") {
    return <div className="checkout-result">Validando pago...</div>;
  }

  if (status === "error") {
    return (
      <div className="checkout-result error">
        <h2>❌ Pago no confirmado</h2>
        <p>Tu pago no pudo ser validado.</p>
        <button onClick={() => navigate("/checkout")}>
          Volver al checkout
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-result success">
      <h2>✅ ¡Pago exitoso!</h2>
      <p>Tu pedido fue confirmado correctamente.</p>
      <button onClick={() => navigate("/")}>Ir a inicio</button>
    </div>
  );
}
