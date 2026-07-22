import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD26x4nTZphJdqGmDjJHV8UpMw1C3KUSpo",
  authDomain: "dleongold-10de3.firebaseapp.com",
  projectId: "dleongold-10de3",
  storageBucket: "dleongold-10de3.firebasestorage.app",
  messagingSenderId: "351263846211",
  appId: "1:351263846211:web:48ea75103dc071a92149f6",
};

const db = getFirestore(initializeApp(firebaseConfig));
const cleanupId = process.argv[2];

if (cleanupId) {
  await deleteDoc(doc(db, "orders", cleanupId));
  console.log(`Orden de prueba eliminada: ${cleanupId}`);
  process.exit(0);
}

const testOrder = {
  testOrder: true,
  customer: {
    first_name: "Cliente",
    last_name: "Prueba",
    document: "1000000000",
    email: "dleongold@dleongold.com",
    phone: "3000000000",
  },
  shippingAddress: {
    first_name: "Cliente",
    last_name: "Prueba",
    phone: "3000000000",
    address: "Dirección de prueba 123",
    city: "Bogotá",
    province: "Cundinamarca",
    postal_code: "110111",
    reference: "NO DESPACHAR - ORDEN DE PRUEBA",
  },
  items: [{
    productId: "TEST",
    name: "Producto de prueba - NO DESPACHAR",
    price: 120000,
    quantity: 2,
    color: "Azul",
    size: "M",
  }],
  subtotal: 240000,
  shipping: 25000,
  total: 265000,
  paymentMethod: "prueba",
  paymentProvider: "PRUEBA CONTROLADA",
  status: "APPROVED",
  paymentStatus: "APPROVED",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const orderRef = await addDoc(collection(db, "orders"), testOrder);
console.log(`Orden de prueba creada: ${orderRef.id}`);
console.log("Esperando el resultado de la función de correo...");

for (let attempt = 0; attempt < 18; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const snapshot = await getDoc(orderRef);
  const notification = snapshot.data()?.emailNotification;

  if (notification?.status === "sent") {
    console.log(`Notificación enviada correctamente a: ${notification.recipient}`);
    console.log(`Para limpiar: node scripts/testApprovedSale.mjs ${orderRef.id}`);
    process.exit(0);
  }

  if (notification?.status === "failed") {
    console.error(`La función reportó un error: ${notification.error}`);
    console.log(`Para limpiar: node scripts/testApprovedSale.mjs ${orderRef.id}`);
    process.exit(1);
  }
}

console.error("La función no reportó resultado dentro de 90 segundos.");
console.log(`Para limpiar: node scripts/testApprovedSale.mjs ${orderRef.id}`);
process.exit(1);
