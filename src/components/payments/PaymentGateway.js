// src/components/payments/PaymentGateway.js

import PaymentRedirect from "./PaymentRedirect";
import WompiCheckout from "./WompiCheckout";
import PaymentLoader from "./PaymentLoader";
import PaymentError from "./PaymentError";

export default function PaymentGateway({
  paymentData,
  loading,
  error,
}) {
  if (loading) {
    return (
      <PaymentLoader message="Preparando el pago..." />
    );
  }

  if (error) {
    return (
      <PaymentError
        title="Error de pago"
        message={error}
      />
    );
  }

  if (!paymentData) {
    return null;
  }

  const { provider, checkout, redirectUrl } =
    paymentData;

  switch (provider) {
    case "WOMPI":
      return (
        <WompiCheckout checkout={checkout} />
      );

    case "BOLD":
    case "ADDI":
    case "SISTECREDITO":
      return (
        <PaymentRedirect
          redirectUrl={redirectUrl}
        />
      );

    default:
      return (
        <PaymentError
          title="Proveedor no soportado"
          message={`El proveedor "${provider}" no está implementado.`}
        />
      );
  }
}