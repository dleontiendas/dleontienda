import { useEffect, useRef } from "react";

const SDK_URL =
  "https://checkout.bold.co/library/boldPaymentButton.js";

let sdkLoaded = false;

export default function BoldButton({
  checkout,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!checkout) return;

    const loadSdk = () =>
      new Promise((resolve, reject) => {
        if (sdkLoaded) {
          resolve();
          return;
        }

        const existing = document.querySelector(
          `script[src="${SDK_URL}"]`
        );

        if (existing) {
          sdkLoaded = true;
          resolve();
          return;
        }

        const script =
          document.createElement("script");

        script.src = SDK_URL;
        script.async = true;

        script.onload = () => {
          sdkLoaded = true;
          resolve();
        };

        script.onerror = reject;

        document.head.appendChild(script);
      });

    loadSdk()
      .then(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";

        const boldScript =
          document.createElement("script");

        boldScript.setAttribute(
          "data-bold-button",
          ""
        );

        boldScript.setAttribute(
          "data-order-id",
          checkout.orderId
        );

        boldScript.setAttribute(
          "data-currency",
          checkout.currency
        );

        boldScript.setAttribute(
          "data-amount",
          checkout.amount
        );

        boldScript.setAttribute(
          "data-api-key",
          checkout.apiKey
        );

        boldScript.setAttribute(
          "data-integrity-signature",
          checkout.integritySignature
        );

        if (checkout.description) {
          boldScript.setAttribute(
            "data-description",
            checkout.description
          );
        }

        if (checkout.redirectionUrl) {
          boldScript.setAttribute(
            "data-redirection-url",
            checkout.redirectionUrl
          );
        }

        if (checkout.customer) {
          boldScript.setAttribute(
            "data-customer-data",
            JSON.stringify(
              checkout.customer
            )
          );
        }

        containerRef.current.appendChild(
          boldScript
        );
      })
      .catch(console.error);
  }, [checkout]);

  return (
    <div className="bold-payment">
      <div ref={containerRef} />
    </div>
  );
}