import admin, { db } from "../../firebaseAdmin.js";

export async function processWompiWebhook(req, res) {
  try {
    const event = req.body;

    const transaction = event?.data?.transaction;

    if (!transaction) {
      return res.status(400).send("Invalid payload");
    }

    await db
      .collection("orders")
      .doc(transaction.reference)
      .update({
        status: transaction.status,
        wompiTransactionId: transaction.id,
        paymentProvider: "WOMPI",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("ERROR");
  }
}