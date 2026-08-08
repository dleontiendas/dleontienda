import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebasebaseAdmin.js";

export async function assertAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  if (request.auth.token?.admin === true || request.auth.token?.role === "admin") return request.auth.uid;
  const profile = await db.collection("users").doc(request.auth.uid).get();
  const data = profile.exists ? profile.data() : {};
  const roles = Array.isArray(data.roles) ? data.roles : [];
  if (data.role !== "admin" && !roles.includes("admin")) {
    throw new HttpsError("permission-denied", "Se requiere rol de administrador.");
  }
  return request.auth.uid;
}
