import crypto from "crypto";
import { db } from "../components/utils/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { wompiWebhook } from "./wompi/webhook.js";

export async function wompiWebhook(req, res) {
  try {
    const event = req.body;
    const signature = req.headers["x-wompi-signature"];

    // (opcional pero recomendado)
    const expected = crypto
      .createHmac("sha256", process.env.WOMPI_EVENTS_SECRET)
      .update(JSON.stringify(event))
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).send("Invalid signature");
    }

    const transaction = event.data.transaction;
    const orderId = transaction.reference;
    const status = transaction.status; // APPROVED | DECLINED | VOIDED

    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
      status,
      wompiTransactionId: transaction.id,
      updatedAt: serverTimestamp(),
      paymentProvider: "WOMPI",
    });

    console.log("✅ WOMPI webhook:", orderId, status);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ WOMPI WEBHOOK ERROR:", error);
    res.status(500).send("ERROR");
  }

  app.post("/api/wompi/webhook", wompiWebhook);

}
