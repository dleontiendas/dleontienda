import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import admin, { db } from "../firebasebaseAdmin.js";
import { conversionEvent, sendConversion, trackingEnabled } from "./conversionsDomain.js";
const token = trackingEnabled() ? defineSecret("META_ACCESS_TOKEN") : null;

// A retry after an uncertain response reuses event_id. Meta deduplicates it.
export async function deliverPurchase(orderId, { database = db, now = Date.now, send = sendConversion, config, enabled = trackingEnabled() } = {}) {
  if (!enabled) return "disabled";
  const ref = database.collection("metaConversionEvents").doc(orderId);
  const orderRef = database.collection("orders").doc(orderId);
  const claim = await database.runTransaction(async transaction => {
    const [delivery, snapshot] = await Promise.all([transaction.get(ref), transaction.get(orderRef)]);
    const saved = delivery.data() || {};
    if (saved.status === "sent") return null;
    const event = conversionEvent(orderId, snapshot.data());
    if (!event) return null;
    if (event.event_time * 1000 < now() - 6 * 86400000) return null;
    if (saved.leaseUntil > now()) throw new Error("META_DELIVERY_BUSY");
    transaction.set(ref, { status: "sending", leaseUntil: now() + 30000, attempts: Number(saved.attempts || 0) + 1 }, { merge: true });
    return event;
  });
  if (!claim) return "skipped";
  try {
    await send(claim, config);
    await ref.set({ status: "sent", leaseUntil: 0, sentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return "sent";
  } catch {
    await ref.set({ status: "retry", leaseUntil: 0 }, { merge: true });
    throw new Error("META_DELIVERY_RETRY");
  }
}
// A disabled deployment needs no Meta secret. Enabling CAPI requires a redeploy with the secret bound.
export const metaPurchase = onDocumentWritten({ document: "orders/{orderId}", secrets: token ? [token] : [], retry: true }, async event => {
  if (!trackingEnabled()) return;
  await deliverPurchase(event.params.orderId, { config: {
    pixelId: process.env.META_PIXEL_ID, token: token.value(), version: process.env.META_GRAPH_API_VERSION,
    testCode: process.env.META_TEST_EVENT_CODE || undefined,
  } });
});
