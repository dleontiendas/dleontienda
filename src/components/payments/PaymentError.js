import React from "react";

export default function PaymentError({
  message,
}) {
  if (!message) return null;

  return (
    <div
      className="card-panel red lighten-4"
      style={{ marginTop: 20 }}
    >
      <strong>Error</strong>

      <p>{message}</p>
    </div>
  );
}