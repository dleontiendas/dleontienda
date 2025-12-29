import axios from "axios";
import { getAddiToken } from "./auth.js";

export const createAddiApplication = async (order) => {
  const token = await getAddiToken();

  const res = await axios.post(
    "https://api.addi.com/online-applications",
    {
      allySlug: "247serviciosgold-ecommerce",
      requestedAmount: order.total,
      reference: order.id,
      callbackUrl: "https://dleongold.com/api/addi/callback",
      customer: {
        email: order.email,
        phoneNumber: order.phone,
        documentNumber: order.document,
        documentType: "CC",
        firstName: order.firstName,
        lastName: order.lastName,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      maxRedirects: 0,
      validateStatus: (s) => s === 301,
    }
  );

  return res.headers.location;
};
export const addiCallback = (req, res) => {
  const { status, reference } = req.body;

  switch (status) {
    case "APPROVED":
      // marcar orden como PAGADA
      break;
    case "REJECTED":
    case "DECLINED":
    case "ABANDONED":
      // marcar como FALLIDA
      break;
  }

  res.sendStatus(200);
};