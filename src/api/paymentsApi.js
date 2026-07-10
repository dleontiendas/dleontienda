import axiosClient from "./axiosClient";

export async function createPayment(
  provider,
  payload
) {
  const { data } = await axiosClient.post(
    `/api/payments/${provider.toLowerCase()}`,
    payload
  );

  return data;
}