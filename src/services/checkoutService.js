// src/services/checkoutService.js

import { createOrder } from "../api/ordersApi";
import {
  createWompiPayment,
  createAddiPayment,
  createBoldPayment,
  createSistecreditoPayment,
} from "../api/paymentsApi";

export async function processCheckout(orderData) {
  const order = await createOrder(orderData);

  return order;
}

export {
  createWompiPayment,
  createAddiPayment,
  createBoldPayment,
  createSistecreditoPayment,
};