// src/firebase.js
import { initializeApp } from "firebase/app";
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


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


