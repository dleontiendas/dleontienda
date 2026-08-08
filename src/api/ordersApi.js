// src/api/ordersApi.js

import { httpsCallable } from "firebase/functions";
import { functions } from "../Firebase";

export async function createOrder(order) {
  const callable = httpsCallable(functions, "createOrderWithReservation");
  const response = await callable(order);
  return { id: response.data.orderId };
}

export async function updateOrderStatus(orderId, status) {
  const callable = httpsCallable(functions, "updateOrderStatus");
  const response = await callable({ orderId, status });
  return response.data;
}

export async function getOrderStatus(orderId, accessToken) {
  const callable = httpsCallable(functions, "getOrderStatus");
  const response = await callable({ orderId, accessToken });
  return response.data;
}

export async function listOrders() {
  const callable = httpsCallable(functions, "listOrders");
  const response = await callable({});
  return response.data.orders || [];
}
