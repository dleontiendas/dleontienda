// src/services/checkoutService.js

import { createOrder } from "../api/ordersApi";

export async function processCheckout(
  orderData
) {
  return createOrder(orderData);
}