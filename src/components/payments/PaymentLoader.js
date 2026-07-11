// src/components/payments/PaymentLoader.js

import React from "react";

export default function PaymentLoader({
  message = "Preparando el pago...",
}) {
  return (
    <div
      style={{
        marginTop: 20,
        textAlign: "center",
      }}
    >
      <div className="preloader-wrapper active">
        <div className="spinner-layer spinner-blue-only">
          <div className="circle-clipper left">
            <div className="circle" />
          </div>

          <div className="gap-patch">
            <div className="circle" />
          </div>

          <div className="circle-clipper right">
            <div className="circle" />
          </div>
        </div>
      </div>

      <p>{message}</p>
    </div>
  );
}