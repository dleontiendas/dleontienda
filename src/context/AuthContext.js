// ======================= src/context/AuthContext.js =======================
import React, { createContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../Firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext({
  user: null,
  loading: true,
  loginEmail: async () => {},
  logout: async () => {},
  hasRole: () => false,
  isAdmin: false,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!mounted) return;
        if (!u) {
          setUser(null);
          localStorage.removeItem("user");
          return;
        }
        let profile = null;
        let role = "customer";
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            profile = snap.data();
            if (profile?.role) role = profile.role;
          }
        } catch {}
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
        if (mounted) setLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const loginEmail = async (email, password) => {
    // re-lanza para que el componente muestre el error correcto
    try {
      const cred = await signInWithEmailAndPassword(auth, String(email).trim(), password);
      return cred.user;
    } catch (e) {
      console.warn("🔐 loginEmail error:", e?.code, "| project:", auth?.app?.options?.projectId);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
  };

  const hasRole = (r) =>
    !!user &&
    (user.role === r ||
      (Array.isArray(user?.profile?.roles) && user.profile.roles.includes(r)));
  const isAdmin = hasRole("admin");

  const refreshUser = async () => {
    if (!user?.uid) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const profile = snap.data();
      const role = profile?.role || "customer";
      const compact = { ...user, role, profile };
      setUser(compact);
      localStorage.setItem("user", JSON.stringify(compact));
    }
  };

  const value = useMemo(
    () => ({ user, loading, loginEmail, logout, hasRole, isAdmin, refreshUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};