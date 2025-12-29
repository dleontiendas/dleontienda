import fetch from "node-fetch";
import { getAddiToken } from "./auth.js";

export const createAddiApplication = async (order) => {
  const token = await getAddiToken();

  const res = await fetch(
    `${"https://api.addi.com"}/online-applications`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allySlug: "247serviciosgold-ecommerce",
        requestedAmount: order.total,
        reference: order.id,
        callbackUrl: `${"https://dleongold.com/:3001"}/api/addi/callback`,
        customer: {
          email: order.email,
          phoneNumber: order.phone,
          documentNumber: order.document,
          documentType: "CC",
          firstName: order.firstName,
          lastName: order.lastName,
        },
      }),
      redirect: "manual",
    }
  );

  if (res.status !== 301) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.headers.get("location");
};
