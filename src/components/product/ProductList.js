// src/components/ProductList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";
import "./ProductList.css";

// 🔹 Normaliza los links de Google Drive
const normalizeDriveLink = (url) => {
  if (!url) return null;
  const match =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w800&id=${id}`
    : url;
};

// 🔹 Tarjeta individual de producto
const ProductCard = ({ product }) => {
  const imageFields = product.images || [];
  const displaySrc =
    normalizeDriveLink(imageFields[0]) ||
    "https://via.placeholder.com/400x400?text=No+Image";

  const availableColors = product.variants?.map((v) => v.color).join(", ") || "N/A";
  const availableSizes = product.variants
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
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/400x400?text=No+Image";
              }}
            />
          </div>
          <div className="card-content product-card-content">
            <h6 className="product-name">
              {product.name || "Producto sin nombre"}
            </h6>
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

// 🔹 Lista de productos con filtros dinámicos
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // 🔸 Obtener productos de Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (err) {
        console.error(err);
        setError("Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 🔸 Crear listas únicas de filtros
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const subCategories = [...new Set(products.map((p) => p.subcategory).filter(Boolean))];

  const allColors = products.flatMap((p) =>
    p.variants?.map((v) => v.color) || []
  );
  const colors = [...new Set(allColors)];

  const allSizes = products.flatMap((p) =>
    p.variants?.flatMap((v) => v.sizes?.map((s) => s.size)) || []
  );
  const sizes = [...new Set(allSizes)];

  // 🔸 Filtrar productos dinámicamente
  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSubCategory =
      !selectedSubCategory || p.subcategory === selectedSubCategory;
    const matchesColor =
      !selectedColor ||
      p.variants?.some((v) => v.color === selectedColor);
    const matchesSize =
      !selectedSize ||
      p.variants?.some((v) =>
        v.sizes?.some((s) => s.size === selectedSize)
      );

    return matchesCategory && matchesSubCategory && matchesColor && matchesSize;
  });

  if (loading) return <p className="center-align">Cargando productos...</p>;
  if (error) return <p className="center-align red-text">{error}</p>;

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">PRODUCTOS</h4>

      {/* 🔹 Filtros */}
      <div className="filters row">
        <div className="input-field col s12 m6 l3">
          <select
            className="browser-default"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="input-field col s12 m6 l3">
          <select
            className="browser-default"
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
          >
            <option value="">Todas las subcategorías</option>
            {subCategories.map((sub) => (
              <option key={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="input-field col s12 m6 l3">
          <select
            className="browser-default"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="">Todos los colores</option>
            {colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="input-field col s12 m6 l3">
          <select
            className="browser-default"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
          >
            <option value="">Todas las tallas</option>
            {sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔹 Lista de productos */}
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
