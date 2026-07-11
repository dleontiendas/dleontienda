// src/components/payments/WompiCheckout.js

import { useEffect } from "react";
import { loadExternalScript } from "../../components/utils/loadExternalScript";

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

        const widget =
          new window.WidgetCheckout(
            checkout
          );

        widget.open();
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