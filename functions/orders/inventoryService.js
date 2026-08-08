import admin, { db } from "../firebasebaseAdmin.js";
import { changeItemStock, normalizePaymentStatus, RESTORE_AFTER_COMMIT_STATUSES, transitionInventoryStatus } from "./inventoryDomain.js";

const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

export async function applyPaymentStatus({ orderId, status, provider, eventId = null, providerData = {}, expectedTotal = null }) {
  if (!orderId) throw new Error("ORDER_ID_REQUIRED");
  const orderRef = db.collection("orders").doc(String(orderId));
  return db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) throw new Error("ORDER_NOT_FOUND");
    const order = orderSnapshot.data();
    const orderProvider = String(order.paymentProvider || "").toUpperCase();
    const incomingProvider = String(provider || "").toUpperCase();
    if (orderProvider && incomingProvider && orderProvider !== incomingProvider) {
      throw new Error("PAYMENT_PROVIDER_MISMATCH");
    }
    if (expectedTotal !== null && Number(expectedTotal) !== Number(order.total)) {
      throw new Error("PAYMENT_AMOUNT_MISMATCH");
    }
    const normalized = normalizePaymentStatus(status);
    const staleFailureAfterCommit = order.inventoryStatus === "committed"
      && !RESTORE_AFTER_COMMIT_STATUSES.has(normalized)
      && !new Set(["APPROVED", "APPROVE", "PAID", "SUCCESS"]).has(normalized);
    const effectiveStatus = staleFailureAfterCommit
      ? normalizePaymentStatus(order.paymentStatus || order.status || "APPROVED")
      : normalized;
    const transition = transitionInventoryStatus(order.inventoryStatus, effectiveStatus);
    const items = Array.isArray(order.items) ? order.items : [];
    const productRefs = Array.from(new Set(items.map((item) => item.productPath).filter(Boolean))).map((path) => db.doc(path));
    const productSnapshots = transition.stockDelta
      ? await Promise.all(productRefs.map((ref) => transaction.get(ref)))
      : [];
    const byPath = new Map(productSnapshots.map((snapshot) => [snapshot.ref.path, snapshot]));

    if (transition.stockDelta) {
      const nextProducts = new Map();
      for (const item of items) {
        if (!item.productPath) throw new Error("ORDER_ITEM_PRODUCT_PATH_REQUIRED");
        const snapshot = byPath.get(item.productPath);
        if (!snapshot?.exists) throw new Error("PRODUCT_NOT_FOUND_WHILE_RELEASING");
        const current = nextProducts.get(item.productPath) || snapshot.data();
        nextProducts.set(item.productPath, changeItemStock(current, item, transition.stockDelta));
      }
      for (const [path, product] of nextProducts) {
        transaction.update(db.doc(path), { variants: product.variants, updated_at: serverTimestamp() });
      }
    }

    const eventKey = eventId ? String(eventId) : `${provider || "UNKNOWN"}:${normalized}`;
    const processedEvents = Array.isArray(order.processedPaymentEvents) ? order.processedPaymentEvents : [];
    const nextEvents = processedEvents.includes(eventKey) ? processedEvents : [...processedEvents, eventKey].slice(-50);
    transaction.update(orderRef, {
      status: effectiveStatus,
      paymentStatus: effectiveStatus,
      paymentProvider: provider || order.paymentProvider || null,
      providerData: { ...(order.providerData || {}), ...providerData },
      inventoryStatus: transition.next,
      processedPaymentEvents: nextEvents,
      updatedAt: serverTimestamp(),
      ...(transition.next === "committed" && order.inventoryStatus !== "committed" ? { inventoryCommittedAt: serverTimestamp() } : {}),
      ...(transition.next === "released" && order.inventoryStatus !== "released" ? { inventoryReleasedAt: serverTimestamp() } : {}),
    });
    return { status: effectiveStatus, inventoryStatus: transition.next, stockChanged: transition.stockDelta !== 0 };
  });
}
