// context/ProductsContext.js
import React, { createContext, useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("🔍 Iniciando carga de productos desde subcolecciones...");
      setLoading(true);

      try {
        // Obtiene todas las categorías (documentos dentro de "productos")
        const categoriasSnapshot = await getDocs(collection(db, "productos"));
        console.log(`📦 Categorías encontradas: ${categoriasSnapshot.size}`);

        const allProducts = [];

        // Recorre cada categoría y busca los productos en "items"
        for (const categoriaDoc of categoriasSnapshot.docs) {
          const categoriaId = categoriaDoc.id;
          console.log(`📂 Buscando productos en categoría: ${categoriaId}`);

          const itemsRef = collection(db, "productos", categoriaId, "items");
          const itemsSnapshot = await getDocs(itemsRef);

          itemsSnapshot.forEach((itemDoc) => {
            const data = itemDoc.data();
            allProducts.push({
              id: itemDoc.id,
              category: categoriaId,
              ...data,
            });
          });

          console.log(
            `✅ ${itemsSnapshot.size} productos cargados desde ${categoriaId}`
          );
        }

        setProducts(allProducts);
        console.log(`🎉 Total productos cargados: ${allProducts.length}`);
      } catch (error) {
        console.error("❌ Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading }}>
      {children}
    </ProductsContext.Provider>
  );
};
