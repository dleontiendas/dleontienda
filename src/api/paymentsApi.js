// src/api/paymentsApi.js

import axiosClient from "./axiosClient";

export async function createWompiPayment(payload) {
  const { data } = await axiosClient.post(
    "/api/payments/wompi",
    payload
  );

  return data;
}

export async function createAddiPayment(payload) {
  const { data } = await axiosClient.post(
    "/api/payments/addi",
    payload
  );

  return data;
}

export async function createBoldPayment(payload) {
  const { data } = await axiosClient.post(
    "/api/payments/bold",
    payload
  );

  return data;
}

export async function createSistecreditoPayment(payload) {
  const { data } = await axiosClient.post(
    "/api/payments/sistecredito",
    payload
  );

  return data;
}