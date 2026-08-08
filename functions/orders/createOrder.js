import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { changeItemStock, findSizeLocation } from "./inventoryDomain.js";
import crypto from "node:crypto";

const RESERVATION_MINUTES = 30;

const requireText = (value, field) => {
  const text = String(value || "").trim();
  if (!text) throw new HttpsError("invalid-argument", `Falta ${field}.`);
  return text;
};

export async function createOrderWithReservationHandler(request) {
  const data = request.data || {};
  const requestedItems = Array.isArray(data.items) ? data.items : [];
  if (!requestedItems.length) throw new HttpsError("invalid-argument", "El carrito está vacío.");
  if (requestedItems.length > 50) throw new HttpsError("invalid-argument", "El pedido contiene demasiados artículos.");

  const orderRef = db.collection("orders").doc();
  const accessToken = crypto.randomBytes(32).toString("hex");
  const accessTokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");
  const itemRefs = await Promise.all(requestedItems.map(async (item) => {
    const productId = requireText(item.productId, "productId");
    const category = String(item.catSlug || "").trim();
    if (category) return db.collection("productos").doc(category).collection("items").doc(productId);
    const matches = await db.collectionGroup("items").where("sku", "==", productId).get();
    if (matches.empty) throw new HttpsError("not-found", `El producto ${productId} no existe.`);
    if (matches.size > 1) throw new HttpsError("failed-precondition", `El producto ${productId} está duplicado en el catálogo.`);
    return matches.docs[0].ref;
  }));

  try {
    await db.runTransaction(async (transaction) => {
      const uniqueRefs = Array.from(new Map(itemRefs.map((ref) => [ref.path, ref])).values());
      const snapshots = await Promise.all(uniqueRefs.map((ref) => transaction.get(ref)));
      const byPath = new Map(snapshots.map((snapshot) => [snapshot.ref.path, snapshot]));
      const nextProducts = new Map();
      const orderItems = [];

      requestedItems.forEach((requested, index) => {
        const ref = itemRefs[index];
        const snapshot = byPath.get(ref.path);
        if (!snapshot?.exists) throw new HttpsError("not-found", `El producto ${requested.productId} no existe.`);
        const current = nextProducts.get(ref.path) || snapshot.data();
        const quantity = Math.trunc(Number(requested.quantity));
        if (!Number.isInteger(quantity) || quantity <= 0) throw new HttpsError("invalid-argument", "La cantidad debe ser un entero positivo.");
        const location = findSizeLocation(current, requested);
        if (!location) throw new HttpsError("not-found", `No existe la variante ${requested.skuMaster || `${requested.color}/${requested.size}`}.`);
        let updated;
        try {
          updated = changeItemStock(current, { ...requested, quantity }, -1);
        } catch (error) {
          if (error.message === "INSUFFICIENT_STOCK") throw new HttpsError("failed-precondition", `No hay inventario suficiente para ${current.name || requested.productId}.`);
          throw error;
        }
        nextProducts.set(ref.path, updated);
        const size = current.variants[location.variantIndex].tallas[location.sizeIndex];
        orderItems.push({
          productId: snapshot.id,
          productPath: ref.path,
          skuMaster: String(size.sku_master || requested.skuMaster || "").trim(),
          name: current.name || "Producto",
          price: Math.max(0, Number(current.price_cop) || 0),
          quantity,
          color: current.variants[location.variantIndex].color || requested.color || "",
          size: size.size || requested.size || "",
          image: requested.image || null,
        });
      });

      for (const [path, product] of nextProducts) {
        transaction.update(db.doc(path), { variants: product.variants, updated_at: admin.firestore.FieldValue.serverTimestamp() });
      }
      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = Math.max(0, Number(data.shipping) || 0);
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + RESERVATION_MINUTES * 60 * 1000);
      const immediateCommit = new Set(["CASH", "WHATSAPP"]).has(String(data.paymentProvider || "").toUpperCase());
      transaction.set(orderRef, {
        customer: data.customer || {},
        shippingAddress: data.shippingAddress || {},
        items: orderItems,
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentMethod: data.paymentMethod || "",
        paymentProvider: data.paymentProvider || "",
        wompiType: data.wompiType || null,
        boldType: data.boldType || null,
        status: immediateCommit ? "APPROVED" : "PENDING",
        paymentStatus: immediateCommit ? "APPROVED" : "PENDING",
        inventoryStatus: immediateCommit ? "committed" : "reserved",
        reservationExpiresAt: expiresAt,
        processedPaymentEvents: [],
        accessTokenHash,
        externalId: null,
        providerData: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(immediateCommit ? { inventoryCommittedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
      });
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "No fue posible reservar el inventario.");
  }
  return { success: true, orderId: orderRef.id, accessToken };
}

export const createOrderWithReservation = onCall({ cors: true }, createOrderWithReservationHandler);
