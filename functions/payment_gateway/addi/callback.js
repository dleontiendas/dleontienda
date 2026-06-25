import admin, { db } from "../../firebaseAdmin.js";

export async function addiCallback(req, res) {
  try {
    const payload = req.body;

    const orderId = payload.externalReference;
    const status = payload.status;

    if (!orderId || !status) {
      return res.status(400).send("Invalid payload");
    }

    await db.collection("orders").doc(orderId).update({
      status,
      addiApplicationId: payload.applicationId,
      paymentProvider: "ADDI",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("ERROR");
  }
}