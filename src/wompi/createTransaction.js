import fetch from "node-fetch";

const WOMPI_API = "https://production.wompi.co/v1/transactions";

export async function createWompiTransaction({
  orderId,
  total,
  wompiType,
  customer,
}) {
  const body = {
    amount_in_cents: total * 100,
    currency: "COP",
    reference: orderId,
    customer_email: customer.email,
    payment_method: {
      type:
        wompiType === "PSE"
          ? "PSE"
          : wompiType === "NEQUI"
          ? "NEQUI"
          : "CARD",
    },
    redirect_url: `${process.env.FRONTEND_URL}/checkout/success`,
  };

  const res = await fetch(WOMPI_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data?.data?.id) {
    throw new Error("Error creando transacción Wompi");
  }

  return {
    redirectUrl: `https://checkout.wompi.co/p/${process.env.WOMPI_PUBLIC_KEY}?transaction_id=${data.data.id}`,
  };
}
