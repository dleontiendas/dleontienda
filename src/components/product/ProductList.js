import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";
import "./ProductList.css";

/* ----------------------- Helpers ----------------------- */
const normalizeDriveLink = (url) => {
  if (!url) return null;
  const match =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w800&id=${id}`
    : url;
};

/* -------------------- Product Card -------------------- */
const ProductCard = ({ product }) => {
  const imageFields = product.images || [];
  const displaySrc =
    normalizeDriveLink(imageFields[0]) ||
    "https://via.placeholder.com/400x400?text=No+Image";

  const availableColors =
    product.variants?.map((v) => v.color).join(", ") || "N/A";
  const availableSizes =
    product.variants
      ?.map((v) => v.sizes?.map((s) => s.size).join(", "))
      .join(", ") || "N/A";

  return (
    <div className="col s12 m6 l4 xl3">
      <div className="card product-card-airbnb">
        <Link to={`/products/${product.id}`} className="product-card-link">
          <div className="card-image product-card-image-wrapper">
            <img
              src={displaySrc}
              alt={product.name || "Sin nombre"}
              className="product-image"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://via.placeholder.com/400x400?text=No+Image")
              }
            />
          </div>
          <div className="card-content product-card-content">
            <h6 className="product-name">{product.name || "Sin nombre"}</h6>
            <p className="product-price">
              {product.price_cop
                ? `$${Number(product.price_cop).toLocaleString("es-CO")}`
                : "Precio no disponible"}
            </p>
            <p className="product-sizes">
              <small>Tallas: {availableSizes}</small>
            </p>
            <p className="product-colors">
              <small>Colores: {availableColors}</small>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

/* -------------------- Product List -------------------- */
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    subCategory: "",
    color: "",
    size: "",
    department: "",
  });
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    const fetchProducts = async () => {
      setStatus({ loading: true, error: null });
      try {
        if (!db) throw new Error("Firestore no inicializado correctamente");

        console.log("📦 Cargando productos desde 'items'...");
        const querySnapshot = await getDocs(collectionGroup(db, "items"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`✅ ${items.length} productos cargados`);
        setProducts(items);
      } catch (err) {
        console.error("❌ Error al cargar productos:", err.message);
        setStatus({ loading: false, error: err.message });
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchProducts();
  }, []);

  /* ---------- Generar listas únicas de filtros ---------- */
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );
  const subCategories = useMemo(
    () => [...new Set(products.map((p) => p.subcategory).filter(Boolean))],
    [products]
  );
  const departments = useMemo(
    () => [...new Set(products.map((p) => p.department).filter(Boolean))],
    [products]
  );
  const colors = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants?.map((v) => v.color) || []))],
    [products]
  );
  const sizes = useMemo(
    () =>
      [
        ...new Set(
          products.flatMap((p) =>
            p.variants?.flatMap((v) => v.sizes?.map((s) => s.size)) || []
          )
        ),
      ],
    [products]
  );

  /* -------------------- Aplicar filtros -------------------- */
  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const f = filters;
        const matchesCategory = !f.category || p.category === f.category;
        const matchesSub = !f.subCategory || p.subcategory === f.subCategory;
        const matchesDept = !f.department || p.department === f.department;
        const matchesColor =
          !f.color || p.variants?.some((v) => v.color === f.color);
        const matchesSize =
          !f.size ||
          p.variants?.some((v) => v.sizes?.some((s) => s.size === f.size));
        return (
          matchesCategory &&
          matchesSub &&
          matchesColor &&
          matchesSize &&
          matchesDept
        );
      }),
    [filters, products]
  );

  /* -------------------- UI -------------------- */
  if (status.loading)
    return <p className="center-align">Cargando productos...</p>;
  if (status.error)
    return (
      <p className="center-align red-text">
        Error al cargar productos: {status.error}
      </p>
    );

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">Productos</h4>

      {/* ---------- Filtros ---------- */}
      <div className="filters row">
        {[
          { key: "category", label: "Categoría", options: categories },
          { key: "department", label: "Departamento", options: departments },
          { key: "subCategory", label: "Subcategoría", options: subCategories },
          { key: "color", label: "Color", options: colors },
          { key: "size", label: "Talla", options: sizes },
        ].map(({ key, label, options }) => (
          <div key={key} className="input-field col s12 m6 l3">
            <select
              className="browser-default"
              value={filters[key]}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, [key]: e.target.value }))
              }
            >
              <option value="">Todas las {label.toLowerCase()}s</option>
              {options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* ---------- Lista de productos ---------- */}
      <div className="row">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="center-align">No se encontraron productos</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
