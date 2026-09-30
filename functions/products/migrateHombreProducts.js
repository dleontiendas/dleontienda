import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";

const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const slug = value => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const isLegacyHombreRecord = (product = {}) =>
  normalize(product.category) === "ropa" && ["hombre", "hombres", "caballero", "caballeros"].includes(normalize(product.department));

export const hombreDepartmentFor = (product = {}) => {
  const subcategory = slug(product.subcategory);
  if (/^capri(?:-|$)/.test(subcategory)) return "ROPA DEPORTIVA";
  if (/^(?:jean|jeans|pantalon|pantalones)(?:-|$)/.test(subcategory)) return "JEANS";
  return null;
};

export const migrateHombreFields = (product = {}) => ({
  ...product,
  category: "HOMBRE",
  department: hombreDepartmentFor(product),
});

export function planHombreMigration(records = []) {
  return records
    .filter(({ data }) => isLegacyHombreRecord(data) && hombreDepartmentFor(data))
    .map(({ id, path, data }) => ({
      id,
      sourcePath: path,
      destinationPath: "productos/hombre/items/" + id,
      data: migrateHombreFields(data),
    }));
}

export async function migrateHombreProductsHandler(request) {
  await assertAdmin(request);
  const sourceSnapshot = await db.collection("productos").doc("ropa").collection("items").get();
  const records = sourceSnapshot.docs.map(snapshot => ({ id: snapshot.id, path: snapshot.ref.path, data: snapshot.data() }));
  const plan = planHombreMigration(records);
  const legacy = records.filter(({ data }) => isLegacyHombreRecord(data));
  const plannedIds = new Set(plan.map(({ id }) => id));
  const skipped = legacy.filter(({ id }) => !plannedIds.has(id)).map(({ id, data }) => ({ id, subcategory: data.subcategory || "" }));
  const destinationRefs = plan.map(({ destinationPath }) => db.doc(destinationPath));
  const existing = destinationRefs.length ? await db.getAll(...destinationRefs) : [];
  const collisions = existing.filter(snapshot => snapshot.exists).map(snapshot => snapshot.id);
  const summary = {
    affected: plan.length,
    jeans: plan.filter(({ data }) => data.department === "JEANS").length,
    sportswear: plan.filter(({ data }) => data.department === "ROPA DEPORTIVA").length,
    collisions,
    skipped,
    skus: plan.map(({ id }) => id),
  };

  if (request.data?.execute !== true) return { success: true, dryRun: true, ...summary };
  if (collisions.length) throw new HttpsError("already-exists", "Hay " + collisions.length + " SKU(s) en la categoría Hombre.");
  if (skipped.length) throw new HttpsError("failed-precondition", "Hay " + skipped.length + " producto(s) Hombre sin clasificación segura.");
  if (!plan.length) return { success: true, dryRun: false, migrated: 0, ...summary };

  await db.runTransaction(async transaction => {
    const currentDestinations = await transaction.getAll(...destinationRefs);
    if (currentDestinations.some(snapshot => snapshot.exists)) throw new HttpsError("already-exists", "La categoría Hombre cambió durante la migración.");
    const updatedAt = admin.firestore.FieldValue.serverTimestamp();
    plan.forEach(({ sourcePath, destinationPath, data }) => {
      transaction.set(db.doc(destinationPath), { ...data, updated_at: updatedAt, migrated_from: sourcePath });
      transaction.delete(db.doc(sourcePath));
    });
  });
  return { success: true, dryRun: false, migrated: plan.length, ...summary };
}

export const migrateHombreProducts = onCall({ cors: true, timeoutSeconds: 120 }, migrateHombreProductsHandler);
