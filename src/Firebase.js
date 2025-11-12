// src/Firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const env = (vite, cra) =>
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[vite]) ||
  (typeof process !== "undefined" && process.env && process.env[cra]) || "";

const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", "REACT_APP_FIREBASE_API_KEY"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", "REACT_APP_FIREBASE_AUTH_DOMAIN"),
  projectId: env("VITE_FIREBASE_PROJECT_ID", "REACT_APP_FIREBASE_PROJECT_ID"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", "REACT_APP_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID", "REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("VITE_FIREBASE_APP_ID", "REACT_APP_FIREBASE_APP_ID"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", "REACT_APP_FIREBASE_MEASUREMENT_ID") || undefined,
};

const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.warn("⚠️ Variables Firebase faltantes:", missing, "→ usando fallback público.");
  Object.assign(firebaseConfig, {
    apiKey: "AIzaSyD26x4nTZphJdqGmDjJHV8UpMw1C3KUSpo",
    authDomain: "dleongold-10de3.firebaseapp.com",
    projectId: "dleongold-10de3",
    storageBucket: "dleongold-10de3.appspot.com",
    messagingSenderId: "351263846211",
    appId: "1:351263846211:web:48ea75103dc071a92149f6",
    measurementId: "G-V8GVFLGN07",
  });
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
// Debug
// @ts-ignore
console.log("🧭 projectId(web):", app.options?.projectId || "(desconocido)");