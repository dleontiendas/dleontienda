// src/components/ProductList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";
import "./ProductList.css";

// 🔹 Normalizar links de Google Drive
const normalizeDriveLink = (url) => {
  if (!url) return null;
  const match =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w800&id=${id}`
    : url;
};

// 🔹 Tarjeta de producto
const ProductCard = ({ product }) => {
  const imageFields = [
    product["Imagen de producto 1"],
    product["Imagen de producto 2"],
    product["Imagen de producto 3"],
    product["Imagen de producto 4"],
    product["Imagen de producto 5"],
  ].filter(Boolean);

  const displaySrc =
    normalizeDriveLink(imageFields[0]) ||
    "https://via.placeholder.com/400x400?text=No+Image";

  return (
    <div className="col s12 m6 l4 xl3">
      <div className="card product-card-airbnb">
        <Link to={`/products/${product.id}`} className="product-card-link">
          <div className="card-image product-card-image-wrapper">
            <img
              src={displaySrc}
              alt={product["nombre"] || "Sin nombre"}
              className="product-image"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/400x400?text=No+Image";
              }}
            />
          </div>
          <div className="card-content product-card-content">
            <h6 className="product-name">
              {product["nombre"] || "Producto sin nombre"}
            </h6>
            <p className="product-price">
              {product["Precio (COL)"]
                ? `$${Number(product["Precio (COL)"]).toLocaleString("es-CO")}`
                : "Precio no disponible"}
            </p>
            {product["Talla"] && (
              <p className="product-sizes">
                <small>Talla: {product["Talla"]}</small>
              </p>
            )}
            {product["Color"] && (
              <p className="product-colors">
                <small>Color: {product["Color"]}</small>
              </p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

// 🔹 Lista de productos con filtros
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // estados de filtros
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

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
        setError("Error al cargar productos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // valores únicos para filtros
  const categories = [...new Set(products.map((p) => p["Categoria"]).filter(Boolean))];
  const subCategories = [...new Set(products.map((p) => p["Sub-Categoria"]).filter(Boolean))];
  const colors = [...new Set(products.map((p) => p["Color"]).filter(Boolean))];
  const sizes = [...new Set(products.map((p) => p["Talla"]).filter(Boolean))];

  // filtrar dinámicamente
  const filteredProducts = products.filter((p) => {
    return (
      (!selectedCategory || p["Categoria"] === selectedCategory) &&
      (!selectedSubCategory || p["Sub-Categoria"] === selectedSubCategory) &&
      (!selectedColor || p["Color"] === selectedColor) &&
      (!selectedSize || p["Talla"] === selectedSize)
    );
  });

  if (loading) return <p className="center-align">Cargando productos...</p>;
  if (error) return <p className="center-align red-text">{error}</p>;

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">PRODUCTOS</h4>

      {/* Filtros */}
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
              <option key={cat} value={cat}>
                {cat}
              </option>
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
              <option key={sub} value={sub}>
                {sub}
              </option>
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
              <option key={c} value={c}>
                {c}
              </option>
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
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de productos */}
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
