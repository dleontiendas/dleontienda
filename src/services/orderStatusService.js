// src/services/orderStatusService.js

import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../Firebase";

/**
 * Escucha una orden específica.
 */
export function listenOrder(
  orderId,
  onNext,
  onError
) {
  return onSnapshot(
    doc(db, "orders", orderId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }

      onNext({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError
  );
}

/**
 * Escucha las órdenes de un usuario.
 */
export function listenUserOrders(
  uid,
  onNext,
  onError
) {
  const q = query(
    collection(db, "orders"),
    where("customer.uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

      onNext(orders);
    },
    onError
  );
}