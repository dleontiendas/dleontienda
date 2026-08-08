import { httpsCallable } from "firebase/functions";
import { functions } from "../Firebase";

export async function importProducts(products) {
  const callable = httpsCallable(functions, "importProducts");
  const response = await callable({ products });
  return response.data;
}

export async function manageProduct(action, payload = {}) {
  const callable = httpsCallable(functions, "manageProduct");
  const response = await callable({ action, ...payload });
  return response.data;
}
