import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { applyPaymentStatus } from "./inventoryService.js";
import { assertAdmin } from "../shared/authorization.js";

const INVENTORY_STATUS_MAP = {
  Cancelado: "CANCELLED",
  Reembolsado: "REFUNDED",
};

export async function updateOrderStatusHandler(request) {
  await assertAdmin(request);
  const orderId = String(request.data?.orderId || "").trim();
  const status = String(request.data?.status || "").trim();
  if (!orderId || !status) throw new HttpsError("invalid-argument", "Faltan orderId o status.");
  const inventoryStatus = INVENTORY_STATUS_MAP[status];
  if (inventoryStatus) {
    await applyPaymentStatus({
      orderId,
      status: inventoryStatus,
      provider: null,
      eventId: `admin:${inventoryStatus}:${orderId}`,
    });
  }
  await db.collection("orders").doc(orderId).update({
    estado: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true, inventoryUpdated: Boolean(inventoryStatus) };
}

export const updateOrderStatus = onCall({ cors: true }, updateOrderStatusHandler);

export { applyPaymentStatus };
