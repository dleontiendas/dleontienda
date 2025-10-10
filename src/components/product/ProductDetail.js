// src/components/ProductDetail.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import { CartContext } from "../../context/CartContext";
import "./ProductDetail.css";

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

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const productRef = doc(db, "productos", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const data = { id: productSnap.id, ...productSnap.data() };
          setProduct(data);

          // preparar imágenes
          const imgs = [
            data["Imagen de producto 1"],
            data["Imagen de producto 2"],
            data["Imagen de producto 3"],
            data["Imagen de producto 4"],
            data["Imagen de producto 5"],
          ]
            .filter(Boolean)
            .map(normalizeDriveLink);

          if (imgs.length) setMainImage(imgs[0]);
        } else {
          setError("Producto no encontrado");
        }
      } catch (err) {
        console.error("Error fetching product detail", err);
        setError("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  if (loading) return <p>Cargando producto...</p>;
  if (error) return <p className="red-text">{error}</p>;
  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    addToCart(product, 1, selectedSize, selectedColor);
    navigate("/checkout");
  };

  // preparar tallas y colores
  const tallas = product["Talla"]
    ? String(product["Talla"]).split(",").map((t) => t.trim())
    : [];
  const colores = product["Color"]
    ? String(product["Color"]).split(",").map((c) => c.trim())
    : [];

  const imagenes = [
    product["Imagen de producto 1"],
    product["Imagen de producto 2"],
    product["Imagen de producto 3"],
    product["Imagen de producto 4"],
    product["Imagen de producto 5"],
  ]
    .filter(Boolean)
    .map(normalizeDriveLink);

  return (
    <div className="container product-detail-container">
      <div className="product-detail-grid">
        {/* Columna izquierda: Galería */}
        <div className="product-detail-image">
          <img
            src={
              mainImage ||
              "https://via.placeholder.com/400x400?text=No+Image"
            }
            alt={product["Nombre"]}
            onError={(e) =>
              (e.currentTarget.src =
                "https://via.placeholder.com/400x400?text=No+Image")
            }
          />

          {imagenes.length > 1 && (
            <div className="product-thumbnails">
              {imagenes.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`vista-${i}`}
                  className={mainImage === img ? "active" : ""}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha: Información */}
        <div className="product-detail-info">
          <h2 className="product-detail-title">
            {product["nombre"] || "Producto sin nombre"}
          </h2>
          <p className="product-detail-description">
            {product["descripción"] || "Sin descripción"}
          </p>
          <p className="product-detail-price">
            {product["Precio (COL)"]
              ? `$${Number(product["Precio (COL)"]).toLocaleString("es-CO")}`
              : "N/A"}
          </p>

          {/* Datos adicionales */}
          <ul className="product-extra-info">
            <li><strong>Marca:</strong> {product["Marca"] || "—"}</li>
            <li><strong>Categoría:</strong> {product["Categoria"] || "—"}</li>
            <li><strong>Sub-Categoría:</strong> {product["Sub-Categoria"] || "—"}</li>
            <li><strong>Departamento:</strong> {product["Departamento"] || "—"}</li>
            <li><strong>Peso:</strong> {product["Peso (Gr)"] || "—"} gr</li>
            <li><strong>Inventario:</strong> {product["Inventario"] || "—"}</li>
            <li><strong>Garantía:</strong> {product["Garantia"] || "—"}</li>
            <li><strong>Materiales:</strong> {product["Materiales y composición"] || "—"}</li>
            <li><strong>Cuidados:</strong> {product["Cuidados y lavado"] || "—"}</li>
          </ul>

          {/* Tallas */}
          {tallas.length > 0 && (
            <div className="product-detail-option">
              <label htmlFor="size">Talla:</label>
              <select
                id="size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="browser-default"
              >
                <option value="">Selecciona una talla</option>
                {tallas.map((talla) => (
                  <option key={talla} value={talla}>
                    talla
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Colores */}
          {colores.length > 0 && (
            <div className="product-detail-option">
              <label htmlFor="color">Color:</label>
              <select
                id="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="browser-default"
              >
                <option value="">Selecciona un color</option>
                {colores.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botones */}
          <div className="product-detail-actions">
            <button
              className="btn add-to-cart-btn"
              disabled={!selectedSize && tallas.length > 0}
              onClick={handleAddToCart}
            >
              Agregar al Carrito
            </button>
            <button
              className="btn buy-now-btn"
              disabled={!selectedSize && tallas.length > 0}
              onClick={handleBuyNow}
            >
              Comprar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
