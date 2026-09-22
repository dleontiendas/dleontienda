import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";

export const sanitizeCategoryId = (value) =>
  String(value || "sin_categoria")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 120) || "sin_categoria";

const normalizeColor = (value) => String(value || "").trim().toLocaleLowerCase("es");

export function validateImportedPrices(product) {
  for (const field of ["price_cop", "oldPrice"]) {
    if (field === "oldPrice" && (product[field] === undefined || product[field] === null || product[field] === "")) continue;
    const value = product[field];
    if (!["number", "string"].includes(typeof value) || !Number.isFinite(Number(value)) || Number(value) <= 0) {
      throw new HttpsError("invalid-argument", `Precio inválido (${field}) para ${product.sku || "producto"}. Debe ser mayor que cero.`);
    }
  }
}

const replaceImportedImages = (current, incoming) => {
  const imported = Array.isArray(incoming) ? incoming.filter(Boolean) : [];
  // Empty image cells leave the current gallery unchanged.
  return Array.from(new Set(imported.length ? imported : (Array.isArray(current) ? current : [])));
};

const cleanSize = (size) => ({
  ...size,
  size: String(size?.size || "").trim(),
  sku_master: String(size?.sku_master || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9-]/g, ""),
  stock: Math.max(0, Math.trunc(Number(size?.stock) || 0)),
});

export function mergeImportedProduct(existing, incoming) {
  validateImportedPrices(incoming);
  const isNewProduct = !existing;
  const current = existing || {};
  const existingVariants = Array.isArray(current.variants)
    ? current.variants.map((variant) => ({
        ...variant,
        images: Array.isArray(variant.images) ? [...variant.images] : [],
        tallas: Array.isArray(variant.tallas) ? variant.tallas.map((size) => ({ ...size })) : [],
      }))
    : [];

  for (const importedVariant of incoming.variants || []) {
    let targetVariant = existingVariants.find((variant) => normalizeColor(variant.color) === normalizeColor(importedVariant.color));
    if (!targetVariant) {
      targetVariant = { color: String(importedVariant.color || "").trim(), images: [], tallas: [] };
      existingVariants.push(targetVariant);
    }
    targetVariant.images = replaceImportedImages(targetVariant.images, importedVariant.images);

    for (const rawSize of importedVariant.tallas || []) {
      const importedSize = cleanSize(rawSize);
      let byMasterSku = null;
      let masterVariant = null;
      for (const variant of existingVariants) {
        const found = variant.tallas.find((size) =>
          importedSize.sku_master && String(size.sku_master || "").trim() === importedSize.sku_master,
        );
        if (found) {
          byMasterSku = found;
          masterVariant = variant;
          break;
        }
      }
      const legacyMatch = targetVariant.tallas.find((size) =>
        !size.sku_master && String(size.size || "").trim() === importedSize.size,
      );
      const match = byMasterSku || legacyMatch;
      const shouldReplaceStock = isNewProduct || importedSize.update_inventory === true;

      if (match) {
        if (byMasterSku && masterVariant !== targetVariant) {
          masterVariant.tallas = masterVariant.tallas.filter((size) => size !== byMasterSku);
          targetVariant.tallas.push(byMasterSku);
        }
        Object.assign(match, {
          size: importedSize.size,
          sku_master: importedSize.sku_master,
          stock: shouldReplaceStock ? importedSize.stock : Math.max(0, Number(match.stock) || 0),
        });
      } else {
        targetVariant.tallas.push({
          size: importedSize.size,
          sku_master: importedSize.sku_master,
          stock: shouldReplaceStock ? importedSize.stock : 0,
        });
      }
    }
  }

  const metadata = [
    "sku", "name", "brand", "department", "category", "subcategory", "description",
    "price_cop", "weight_grams", "warranty", "care_instructions", "materials", "specifications",
  ];
  const result = { ...current };
  for (const field of metadata) {
    if (incoming[field] !== undefined && incoming[field] !== null) result[field] = incoming[field];
  }
  result.price_cop = Number(incoming.price_cop);
  // Missing oldPrice from older clients preserves existing data; an empty cell clears it.
  if (incoming.oldPrice !== undefined) result.oldPrice = incoming.oldPrice === null || incoming.oldPrice === "" ? null : Number(incoming.oldPrice);
  result.images = replaceImportedImages(current.images, incoming.images);
  result.variants = existingVariants;
  result.active = isNewProduct ? true : current.active !== false;
  return result;
}

async function findExistingProduct(baseSku) {
  const snapshot = await db.collectionGroup("items").where("sku", "==", baseSku).get();
  if (snapshot.size > 1) {
    throw new HttpsError("failed-precondition", `La referencia ${baseSku} existe en más de un documento. Corrige el duplicado antes de importar.`);
  }
  return snapshot.empty ? null : snapshot.docs[0].ref;
}

export async function importProductsHandler(request) {
  await assertAdmin(request);
  const products = request.data?.products;
  if (!Array.isArray(products) || !products.length) throw new HttpsError("invalid-argument", "No se recibieron productos válidos.");
  if (products.length > 500) throw new HttpsError("invalid-argument", "La carga supera el máximo de 500 productos.");
  const confirmedExistingSkus = new Set(
    (Array.isArray(request.data?.confirmedExistingSkus) ? request.data.confirmedExistingSkus : [])
      .map((sku) => String(sku || "").trim())
      .filter(Boolean),
  );

  const seen = new Set();
  const seenMasterSkus = new Map();
  for (const product of products) {
    validateImportedPrices(product);
    const sku = String(product?.sku || "").trim();
    if (!sku || sku.includes("/") || seen.has(sku)) throw new HttpsError("invalid-argument", `Referencia base vacía, inválida o duplicada: ${sku || "(vacía)"}.`);
    seen.add(sku);
    for (const variant of product.variants || []) {
      for (const size of variant.tallas || []) {
        const normalized = cleanSize(size).sku_master;
        if (!normalized) throw new HttpsError("invalid-argument", `SKU Maestro vacío en la fila ${size.source_row || "desconocida"}.`);
        if (seenMasterSkus.has(normalized)) {
          throw new HttpsError("invalid-argument", `SKU Maestro ${normalized} duplicado en las filas ${seenMasterSkus.get(normalized)} y ${size.source_row || "desconocida"}.`);
        }
        seenMasterSkus.set(normalized, size.source_row || "desconocida");
      }
    }
  }

  let created = 0;
  let updated = 0;
  const targets = [];
  const unconfirmed = [];
  for (const product of products) {
    const existingRef = await findExistingProduct(product.sku);
    if (existingRef && !confirmedExistingSkus.has(product.sku)) {
      const snapshot = await existingRef.get();
      unconfirmed.push({ sku: product.sku, name: snapshot.data()?.name || "Producto sin nombre" });
    }
    const destinationRef = db.collection("productos").doc(sanitizeCategoryId(product.category)).collection("items").doc(product.sku);
    targets.push({ product, existingRef, destinationRef });
  }
  if (unconfirmed.length) {
    throw new HttpsError(
      "failed-precondition",
      "La carga contiene referencias que ya existen y requieren confirmación.",
      { conflicts: unconfirmed },
    );
  }

  for (const { product, existingRef, destinationRef } of targets) {
    const existed = await db.runTransaction(async (transaction) => {
      const sourceRef = existingRef || destinationRef;
      const isCategoryMove = sourceRef.path !== destinationRef.path;
      const snapshot = await transaction.get(sourceRef);
      const destinationSnapshot = isCategoryMove ? await transaction.get(destinationRef) : snapshot;
      if (snapshot.exists && !confirmedExistingSkus.has(product.sku)) {
        throw new HttpsError("failed-precondition", `La referencia ${product.sku} ya existe y requiere confirmación.`);
      }
      if (isCategoryMove && destinationSnapshot.exists) {
        throw new HttpsError("already-exists", `Ya existe un documento para ${product.sku} en la categoría ${product.category}.`);
      }
      const merged = mergeImportedProduct(snapshot.exists ? snapshot.data() : null, product);
      const now = admin.firestore.FieldValue.serverTimestamp();
      transaction.set(destinationRef, {
        ...merged,
        updated_at: now,
        ...(snapshot.exists ? {} : { created_at: now }),
      }, { merge: true });
      if (isCategoryMove && snapshot.exists) transaction.delete(sourceRef);
      return snapshot.exists;
    });
    if (existed) updated += 1;
    else created += 1;
  }
  return { success: true, created, updated, total: products.length };
}

export const importProducts = onCall({ cors: true }, importProductsHandler);
