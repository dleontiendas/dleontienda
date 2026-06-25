// src/api/ordersApi.js

import { addDoc, collection } from "firebase/firestore";
import { db } from "../Firebase";

export async function createOrder(order) {
  const docRef = await addDoc(
    collection(db, "orders"),
    order
  );

  return {
    id: docRef.id,
  };
}