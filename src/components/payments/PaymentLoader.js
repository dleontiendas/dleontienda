import React from "react";

export default function PaymentLoader() {
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
            <div className="circle"></div>
          </div>

          <div className="gap-patch">
            <div className="circle"></div>
          </div>

          <div className="circle-clipper right">
            <div className="circle"></div>
          </div>
        </div>
      </div>

      <p>Preparando el pago...</p>
    </div>
  );
}