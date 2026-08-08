import crypto from "node:crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function getOrderStatusHandler(request) {
  const orderId = String(request.data?.orderId || "").trim();
  const accessToken = String(request.data?.accessToken || "").trim();
  if (!orderId || !accessToken) throw new HttpsError("invalid-argument", "Faltan la orden o su token de acceso.");
  const snapshot = await db.collection("orders").doc(orderId).get();
  if (!snapshot.exists) throw new HttpsError("not-found", "La orden no existe.");
  const order = snapshot.data();
  const hash = crypto.createHash("sha256").update(accessToken).digest("hex");
  if (!safeEqual(hash, order.accessTokenHash)) throw new HttpsError("permission-denied", "Token de orden inválido.");
  return {
    id: snapshot.id,
    status: order.status || "PENDING",
    paymentStatus: order.paymentStatus || "PENDING",
    inventoryStatus: order.inventoryStatus || null,
    paymentProvider: order.paymentProvider || null,
    total: Number(order.total || 0),
  };
}

export async function listOrdersHandler(request) {
  await assertAdmin(request);
  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").limit(500).get();
  return {
    orders: snapshot.docs.map((document) => {
      const data = document.data();
      const { accessTokenHash, createdAt, updatedAt, ...safeData } = data;
      return {
        id: document.id,
        ...safeData,
        createdAtMs: createdAt?.toMillis?.() || null,
        updatedAtMs: updatedAt?.toMillis?.() || null,
      };
    }),
  };
}

export const getOrderStatus = onCall({ cors: true }, getOrderStatusHandler);
export const listOrders = onCall({ cors: true }, listOrdersHandler);
