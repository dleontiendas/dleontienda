import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin, { db } from "../firebasebaseAdmin.js";
import { assertAdmin } from "../shared/authorization.js";

const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export const isLegacyDamaRecord = (product = {}) =>
  normalize(product.category) === "ropa" && normalize(product.department) === "dama";

export const migrateDamaFields = (product = {}) => ({
  ...product,
  category: "DAMA",
  department: "JEANS",
});

export function planDamaMigration(records = []) {
  return records
    .filter(({ data }) => isLegacyDamaRecord(data))
    .map(({ id, path, data }) => ({
      id,
      sourcePath: path,
      destinationPath: `productos/dama/items/${id}`,
      data: migrateDamaFields(data),
    }));
}

export async function migrateDamaProductsHandler(request) {
  await assertAdmin(request);
  const sourceSnapshot = await db.collection("productos").doc("ropa").collection("items").get();
  const plan = planDamaMigration(sourceSnapshot.docs.map((snapshot) => ({
    id: snapshot.id,
    path: snapshot.ref.path,
    data: snapshot.data(),
  })));
  const destinationRefs = plan.map(({ destinationPath }) => db.doc(destinationPath));
  const existing = destinationRefs.length ? await db.getAll(...destinationRefs) : [];
  const collisions = existing.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.id);
  const summary = { affected: plan.length, collisions, skus: plan.map(({ id }) => id) };

  if (request.data?.execute !== true) return { success: true, dryRun: true, ...summary };
  if (collisions.length) throw new HttpsError("already-exists", `Hay ${collisions.length} SKU(s) en la categoría Dama.`);
  if (!plan.length) return { success: true, dryRun: false, migrated: 0, ...summary };

  await db.runTransaction(async (transaction) => {
    const currentDestinations = await transaction.getAll(...destinationRefs);
    if (currentDestinations.some((snapshot) => snapshot.exists)) {
      throw new HttpsError("already-exists", "La categoría Dama cambió durante la migración.");
    }
    const updatedAt = admin.firestore.FieldValue.serverTimestamp();
    plan.forEach(({ sourcePath, destinationPath, data }) => {
      transaction.set(db.doc(destinationPath), {
        ...data,
        updated_at: updatedAt,
        migrated_from: sourcePath,
      });
      transaction.delete(db.doc(sourcePath));
    });
  });
  return { success: true, dryRun: false, migrated: plan.length, ...summary };
}

export const migrateDamaProducts = onCall({ cors: true, timeoutSeconds: 120 }, migrateDamaProductsHandler);
