import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../firebasebaseAdmin.js";
import { applyPaymentStatus } from "./inventoryService.js";

export async function releaseExpiredReservations() {
  const snapshot = await db.collection("orders")
    .where("reservationExpiresAt", "<=", new Date())
    .limit(100)
    .get();
  const expiredReservations = snapshot.docs.filter((document) => document.data().inventoryStatus === "reserved");
  const results = await Promise.allSettled(expiredReservations.map((document) =>
    applyPaymentStatus({
      orderId: document.id,
      status: "EXPIRED",
      provider: document.data().paymentProvider || "SYSTEM",
      eventId: `reservation-expired:${document.id}`,
    }),
  ));
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) throw new Error(`No se pudieron liberar ${failures.length} reservas vencidas.`);
  return { released: results.length };
}

export const expireInventoryReservations = onSchedule("every 5 minutes", releaseExpiredReservations);
