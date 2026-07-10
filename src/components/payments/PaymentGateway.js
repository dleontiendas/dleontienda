// src/components/payments/PaymentGateway.js

import React from "react";
import PaymentLoader from "./PaymentLoader";
import PaymentError from "./PaymentError";
import PaymentRedirect from "./PaymentRedirect";
import WompiCheckout from "./WompiCheckout";

export default function PaymentGateway({
  paymentData,
  loading,
  error,
}) {
  if (loading) {
    return <PaymentLoader />;
  }

  if (error) {
    return (
      <PaymentError message={error} />
    );
  }

  if (!paymentData) {
    return null;
  }

  switch (paymentData.provider) {
    case "WOMPI":
      return (
        <WompiCheckout
          checkout={
            paymentData.checkout
          }
        />
      );

    case "BOLD":
    case "ADDI":
    case "SISTECREDITO":
      return (
        <PaymentRedirect
          redirectUrl={
            paymentData.redirectUrl
          }
        />
      );

    default:
      return (
        <PaymentError
          message="Proveedor no soportado."
        />
      );
  }
}