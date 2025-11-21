// Firebase Core
import { initializeApp } from "firebase/app";

// Auth
import { getAuth } from "firebase/auth";

// Firestore
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD26x4nTZphJdqGmDjJHV8UpMw1C3KUSpo",
  authDomain: "dleongold-10de3.firebaseapp.com",
  projectId: "dleongold-10de3",
  storageBucket: "dleongold-10de3.firebasestorage.app",
  messagingSenderId: "351263846211",
  appId: "1:351263846211:web:48ea75103dc071a92149f6",
  measurementId: "G-V8GVFLGN07"
};

// Initialize
const app = initializeApp(firebaseConfig);

// Export Auth + DB
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
