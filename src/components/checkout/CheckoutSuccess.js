// src/pages/CheckoutSuccess/CheckoutSuccess.js

import React, {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import {
  listenOrder,
} from "../../services/orderStatusService";

import "./CheckoutSuccess.css";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const orderId =
  params.get("ref") ||
  localStorage.getItem(
    "lastOrderId"
  );

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
  if (!orderId) {
    setErrorMessage(
      "No se encontró la referencia."
    );

    setStatus("error");
    return;
  }

  const unsubscribe =
    listenOrder(
      orderId,
      (order) => {
        if (!order) {
          setErrorMessage(
            "La orden no existe."
          );

          setStatus("error");
          return;
        }

        setOrder(order);

        switch (
          order.paymentStatus
        ) {
          case "APPROVED":
            localStorage.removeItem(
              "lastOrderId"
            );

            setStatus(
              "success"
            );
            break;

          case "DECLINED":
          case "VOIDED":
          case "ERROR":
            setErrorMessage(
              "El pago no fue aprobado."
            );

            setStatus(
              "error"
            );
            break;

          case "PENDING":
          default:
            setStatus(
              "loading"
            );
        }
      },
      (error) => {
        console.error(error);

        setErrorMessage(
          "No fue posible consultar la orden."
        );

        setStatus("error");
      }
    );

  return () => {
    unsubscribe?.();
  };
}, [orderId]);

  /* ================= LOADING ================= */

  if (status === "loading") {
    return (
      <div className="checkout-result loading">
        <h2>
          ⏳ Estamos confirmando tu pago
        </h2>

        <p>
          Por favor espera mientras
          validamos tu transacción.
        </p>

        {order && (
          <>
            <p>
              Orden:
              <strong>
                {" "}
                {orderId}
              </strong>
            </p>

            <p>
              Estado:
              <strong>
                {" "}
                {order.paymentStatus ||
                  "PENDING"}
              </strong>
            </p>
          </>
        )}
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (status === "error") {
    return (
      <div className="checkout-result error">
        <h2>
          ❌ Pago no confirmado
        </h2>

        <p>
          {errorMessage ||
            "Tu pago no pudo ser validado."}
        </p>

        {order && (
          <>
            <p>
              Orden:
              <strong>
                {" "}
                {orderId}
              </strong>
            </p>

            <p>
              Estado:
              <strong>
                {" "}
                {order.paymentStatus}
              </strong>
            </p>
          </>
        )}

        <div className="actions">
          <button
            onClick={() =>
              navigate("/checkout")
            }
          >
            Volver al checkout
          </button>

          <button
            onClick={() =>
              navigate("/")
            }
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  /* ================= SUCCESS ================= */

  return (
    <div className="checkout-result success">
      <h2>
        ✅ ¡Pago exitoso!
      </h2>

      <p>
        Tu pedido fue confirmado
        correctamente.
      </p>

      <p>
        Número de orden:
        <strong>
          {" "}
          {orderId}
        </strong>
      </p>

      {order && (
        <>
          <p>
            Método de pago:
            <strong>
              {" "}
              {order.paymentProvider}
            </strong>
          </p>

          <p>
            Estado:
            <strong>
              {" "}
              {order.paymentStatus}
            </strong>
          </p>

          <p>
            Total:
            <strong>
              {" "}
              $
              {Number(
                order.total || 0
              ).toLocaleString(
                "es-CO"
              )}
            </strong>
          </p>
        </>
      )}

      <div className="actions">
        <button
          onClick={() =>
            navigate("/")
          }
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}