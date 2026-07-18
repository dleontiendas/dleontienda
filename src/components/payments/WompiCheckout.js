// src/components/payments/WompiCheckout.js

import { useEffect } from "react";
import { loadExternalScript } from "../../components/utils/loadExternalScript";
import axiosClient from "../../api/axiosClient";

const WOMPI_SDK =
  "https://checkout.wompi.co/widget.js";

export default function WompiCheckout({
  checkout,
}) {
  useEffect(() => {
    if (!checkout) return;

    async function openCheckout() {
      try {
        await loadExternalScript(WOMPI_SDK);
console.log("Checkout:", checkout);
        const checkoutConfig = {
  ...checkout,
  customerData: {
    ...(checkout.customerData || {}),
    legalId: checkout.customerData?.legalId,
    legalIdType: checkout.customerData?.legalIdType || "CC",
  },
};
        const widget = new window.WidgetCheckout(checkoutConfig);

widget.open(async (result) => {
  const transaction = result?.transaction;

  if (!transaction?.id) {
    console.error("Wompi no devolvió el identificador de la transacción");
    return;
  }

  try {
    const response = await axiosClient.post(
      "/api/payments/wompi/confirm",
      {
        transactionId: transaction.id,
      }
    );

    console.log("Pago verificado:", response.data);

    if (
      response.data?.paymentStatus === "APPROVED" &&
      checkout.redirectUrl
    ) {
      window.location.assign(checkout.redirectUrl);
    }
  } catch (error) {
    console.error("No fue posible verificar el pago:", error);
  }
});
      } catch (error) {
        console.error(
          "Error cargando Wompi:",
          error
        );
      }
    }

    openCheckout();
  }, [checkout]);

  return (
    <div style={{ marginTop: 20 }}>
      <p>Abriendo Wompi...</p>
    </div>
  );
}