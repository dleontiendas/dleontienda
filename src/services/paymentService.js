// src/services/paymentService.js

import { createPayment } from "../api/paymentsApi";

export async function startPayment(
  provider,
  payload
) {
  const response =
    await createPayment(
      provider,
      payload
    );

  if (!response.success) {
    throw new Error(
      response.message ||
      "No fue posible iniciar el pago."
    );
  }

  return response;
}