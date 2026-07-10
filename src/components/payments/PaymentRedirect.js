import { useEffect } from "react";

export default function PaymentRedirect({
  redirectUrl,
}) {
  useEffect(() => {
    if (redirectUrl) {
      window.location.href =
        redirectUrl;
    }
  }, [redirectUrl]);

  return (
    <p>
      Redireccionando al proveedor...
    </p>
  );
}