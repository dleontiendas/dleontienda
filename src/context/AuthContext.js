// src/context/AuthContext.js  (JS puro)
import React, { createContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../Firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // { uid, email, displayName, role, profile }
  const [loading, setLoading] = useState(true);

  // Hidrata desde localStorage mientras llega Firebase
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUser(null);
          localStorage.removeItem("user");
          return;
        }
        let role = "customer";
        let profile = null;
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            profile = snap.data();
            if (profile && profile.role) role = profile.role;
          }
        } catch (_) {}
        const compact = {
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || "",
          role,
          profile,
        };
        setUser(compact);
        localStorage.setItem("user", JSON.stringify(compact));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loginEmail = async (email, password) =>
    signInWithEmailAndPassword(auth, String(email).trim(), password);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = useMemo(() => ({ user, loading, loginEmail, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
