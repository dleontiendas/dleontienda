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

    const validatePayment = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/payments/validate?orderId=${orderId}`
        );

        if (!res.ok) {
          throw new Error("API error");
        }

        const data = await res.json();

        if (data.status === "APPROVED") {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Validation error:", error);
        setStatus("error");
      }
    };

    validatePayment();
  }, [orderId]);

  /* ===== LOADING ===== */

  if (status === "loading") {
    return (
      <div className="checkout-result loading">
        <h2>Validando pago...</h2>
        <p>Por favor espera mientras confirmamos tu transacción.</p>
      </div>
    );
  }

  /* ===== ERROR ===== */

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

  /* ===== SUCCESS ===== */

  return (
    <div className="checkout-result success">
      <h2>✅ ¡Pago exitoso!</h2>

      <p>
        Tu pedido fue confirmado correctamente.
        <br />
        Recibirás un correo con los detalles.
      </p>

      <button onClick={() => navigate("/")}>
        Ir a inicio
      </button>
    </div>
  );
}
