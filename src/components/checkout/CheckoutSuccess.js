import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./CheckoutSuccess.css";

const API_URL = "https://dleongold.com:3001";

export default function CheckoutSuccess() {

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); 
  const [errorMessage, setErrorMessage] = useState("");

  const orderId = params.get("ref");

  useEffect(() => {

    const validatePayment = async () => {

      if (!orderId) {
        setErrorMessage("No se encontró referencia de pago.");
        setStatus("error");
        return;
      }

      try {

        const res = await fetch(
          `${API_URL}/api/payments/validate?orderId=${orderId}`
        );

        if (!res.ok) {
          throw new Error("Error en la API");
        }

        const data = await res.json();

        if (data?.status === "APPROVED") {
          setStatus("success");
        } else if (data?.status === "PENDING") {
          setErrorMessage("El pago aún está pendiente.");
          setStatus("error");
        } else {
          setErrorMessage("El pago fue rechazado o no encontrado.");
          setStatus("error");
        }

      } catch (error) {
        console.error("Validation error:", error);
        setErrorMessage("No se pudo validar el pago.");
        setStatus("error");
      }
    };

    validatePayment();

  }, [orderId]);



  /* ================= LOADING ================= */

  if (status === "loading") {
    return (
      <div className="checkout-result loading">
        <h2>Validando pago...</h2>
        <p>Por favor espera mientras confirmamos tu transacción.</p>
      </div>
    );
  }



  /* ================= ERROR ================= */

  if (status === "error") {
    return (
      <div className="checkout-result error">
        <h2>❌ Pago no confirmado</h2>

        <p>
          {errorMessage || "Tu pago no pudo ser validado."}
        </p>

        <div className="actions">
          <button onClick={() => navigate("/checkout")}>
            Volver al checkout
          </button>

          <button onClick={() => navigate("/")}>
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }



  /* ================= SUCCESS ================= */

  return (
    <div className="checkout-result success">

      <h2>✅ ¡Pago exitoso!</h2>

      <p>
        Tu pedido fue confirmado correctamente.
      </p>

      <p>
        Número de orden:
        <strong> {orderId}</strong>
      </p>

      <div className="actions">
        <button onClick={() => navigate("/")}>
          Ir a inicio
        </button>
      </div>

    </div>
  );
}