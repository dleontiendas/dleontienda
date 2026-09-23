import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";
import { sanitizeCategoryId, validateImportedPrices } from "./importProducts.js";

const productRefFromPath = (path) => {
  const value = String(path || "").trim();
  if (!/^productos\/[^/]+\/items\/[^/]+$/.test(value)) throw new HttpsError("invalid-argument", "Ruta de producto inválida.");
  return db.doc(value);
};

export const prepareManagedProductPrices = (product) => {
  validateImportedPrices(product);
  const hasOldPrice = Object.prototype.hasOwnProperty.call(product, "oldPrice");
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
        ...variant,
        tallas: Array.isArray(variant.tallas)
          ? variant.tallas.map((size) => ({
              ...size,
              ...(size.price_cop !== undefined && size.price_cop !== null && size.price_cop !== ""
                ? { price_cop: Number(size.price_cop) }
                : {}),
              ...(Object.prototype.hasOwnProperty.call(size, "oldPrice")
                ? { oldPrice: size.oldPrice === null || size.oldPrice === "" ? null : Number(size.oldPrice) }
                : {}),
            }))
          : [],
      }))
    : product.variants;
  return {
    ...product,
    ...(variants ? { variants } : {}),
    price_cop: Number(product.price_cop),
    ...(hasOldPrice ? {
      oldPrice: product.oldPrice === null || product.oldPrice === ""
        ? admin.firestore.FieldValue.delete()
        : Number(product.oldPrice),
    } : {}),
  };
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
    const productToSave = prepareManagedProductPrices(product);
    const currentRef = request.data?.path
      ? productRefFromPath(request.data.path)
      : db.collection("productos").doc(sanitizeCategoryId(product.category)).collection("items").doc(sku);
    const destinationRef = db.collection("productos").doc(sanitizeCategoryId(product.category)).collection("items").doc(sku);
    const result = await db.runTransaction(async (transaction) => {
      const moving = currentRef.path !== destinationRef.path;
      const currentSnapshot = await transaction.get(currentRef);
      const destinationSnapshot = moving ? await transaction.get(destinationRef) : currentSnapshot;
      if (moving && destinationSnapshot.exists) {
        throw new HttpsError("already-exists", `Ya existe ${sku} en la categoría de destino.`);
      }
      const now = admin.firestore.FieldValue.serverTimestamp();
      transaction.set(destinationRef, {
        ...productToSave,
        updated_at: now,
        ...(currentSnapshot.exists ? {} : { created_at: now }),
      }, { merge: true });
      if (moving && currentSnapshot.exists) transaction.delete(currentRef);
      return { created: !currentSnapshot.exists, moved: moving && currentSnapshot.exists };
    });
    return { success: true, path: destinationRef.path, ...result };
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
