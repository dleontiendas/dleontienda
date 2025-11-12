// src/context/ProductsContext.jsx
import React, { createContext, useCallback, useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../Firebase";

export const ProductsContext = createContext({
  products: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const snap = await getDocs(collectionGroup(db, "items"));
      const items = snap.docs.map((doc) => {
        const catSlug = doc.ref.parent?.parent?.id || "sin_categoria"; // ← slug (id de colección)
        return { id: doc.id, catSlug, ...doc.data() };
      });
      setProducts(items);
      if (items[0]) {
        const { id, catSlug, name, price_cop } = items[0];
        console.log("🧪 Primer producto:", { id, category: catSlug, name, price_cop });
      }
    } catch (e) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refresh: fetchAll }}>
      {children}
    </ProductsContext.Provider>
  );
};