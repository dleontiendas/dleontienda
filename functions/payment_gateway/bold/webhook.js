import admin, { db } from "../../firebaseAdmin.js";

export async function processBoldWebhook(req, res) {
  try {
    const event = req.body;

    const orderId =
      event?.metadata?.reference ||
      event?.data?.metadata?.reference;

    if (!orderId) {
      return res.status(400).send("Reference not found");
    }

    const statusMap = {
      SALE_APPROVED: "APPROVED",
      SALE_REJECTED: "REJECTED",
      VOID_APPROVED: "VOIDED",
      VOID_REJECTED: "VOID_REJECTED"
    };

    await db.collection("orders").doc(orderId).update({
      status: statusMap[event.type] || event.type,
      paymentProvider: "BOLD",
      boldPaymentId: event?.data?.payment_id || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("ERROR");
  }
}