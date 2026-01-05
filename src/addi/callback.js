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
export async function addiCallback(req, res) {
  try {
    const payload = req.body;

    /**
     * ADDI envía algo como:
     * {
     *   applicationId,
     *   externalReference, // ← tu orderId
     *   status: APPROVED | REJECTED | DECLINED | ABANDONED
     * }
     */

    const orderId = payload.externalReference;
    const status = payload.status;

    if (!orderId || !status) {
      return res.status(400).send("Invalid ADDI callback");
    }

    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
      status,
      addiApplicationId: payload.applicationId,
      updatedAt: serverTimestamp(),
      paymentProvider: "ADDI",
    });

    console.log("✅ ADDI callback OK:", orderId, status);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ ADDI CALLBACK ERROR:", error);
    res.status(500).send("ERROR");
  }
}