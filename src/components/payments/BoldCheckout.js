import { useEffect } from "react";
import { loadExternalScript } from "../utils/loadExternalScript";

const BOLD_SDK =
  "https://checkout.bold.co/library/boldPaymentButton.js";

export default function BoldCheckout({
  checkout,
}) {
  useEffect(() => {
    if (!checkout) return;

    async function openCheckout() {
      try {
        await loadExternalScript(
          BOLD_SDK
        );
console.log({
  BoldCheckout: window.BoldCheckout,
  Bold: window.Bold,
});

console.log("Bold checkout:", checkout);

await loadExternalScript(BOLD_SDK);

const bold = new window.BoldCheckout(checkout);

bold.open();

        // Aquí inicializaremos el SDK
      } catch (error) {
        console.error(
          "Error cargando Bold:",
          error
        );
      }
    }

    openCheckout();
  }, [checkout]);

  return (
    <div style={{ marginTop: 20 }}>
      <p>Abriendo Bold...</p>
    </div>
  );
}