import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";
import { sanitizeCategoryId } from "./importProducts.js";

const productRefFromPath = (path) => {
  const value = String(path || "").trim();
  if (!/^productos\/[^/]+\/items\/[^/]+$/.test(value)) throw new HttpsError("invalid-argument", "Ruta de producto inválida.");
  return db.doc(value);
};

export async function manageProductHandler(request) {
  await assertAdmin(request);
  const action = String(request.data?.action || "");
  if (action === "save") {
    const product = request.data?.product;
    const sku = String(product?.sku || "").trim();
    if (!sku || sku.includes("/") || !String(product?.name || "").trim()) {
      throw new HttpsError("invalid-argument", "SKU y nombre son obligatorios.");
    }
    const ref = request.data?.path
      ? productRefFromPath(request.data.path)
      : db.collection("productos").doc(sanitizeCategoryId(product.category)).collection("items").doc(sku);
    const snapshot = await ref.get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set({
      ...product,
      updated_at: now,
      ...(snapshot.exists ? {} : { created_at: now }),
    }, { merge: true });
    return { success: true, path: ref.path, created: !snapshot.exists };
  }
  if (action === "delete") {
    const ref = productRefFromPath(request.data?.path);
    await ref.delete();
    return { success: true };
  }
  if (action === "toggle") {
    const ref = productRefFromPath(request.data?.path);
    await ref.update({ active: request.data?.active === true, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true };
  }
  throw new HttpsError("invalid-argument", "Acción de producto no soportada.");
}

export const manageProduct = onCall({ cors: true }, manageProductHandler);
