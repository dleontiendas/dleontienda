// src/components/payments/PaymentError.js

import React from "react";

export default function PaymentError({
  title = "Error",
  message,
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="card-panel red lighten-4"
      style={{
        marginTop: 20,
      }}
    >
      <strong>{title}</strong>

      <p>{message}</p>
    </div>
  );
}