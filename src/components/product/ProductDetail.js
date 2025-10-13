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
const WHATSAPP_NUMBER = "573226094632"; // formato internacional sin '+'




const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizesForColor, setSizesForColor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useContext(CartContext);

  // 🔸 Cargar producto desde Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "productos", productId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProduct(data);

          const imgs = (data.images || []).map(normalizeDriveLink);
          if (imgs.length > 0) setMainImage(imgs[0]);
        } else {
          setError("Producto no encontrado");
        }
      } catch (err) {
        console.error("Error al cargar producto:", err);
        setError("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // 🔹 Actualizar tallas al seleccionar color
  useEffect(() => {
    if (selectedColor && product?.variants) {
      const variant = product.variants.find((v) => v.color === selectedColor);
      setSizesForColor(variant ? variant.sizes : []);
    }
  }, [selectedColor, product]);

  if (loading) return <p>Cargando producto...</p>;
  if (error) return <p className="red-text">{error}</p>;
  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
    navigate("/checkout");
  };

  const availableColors = product.variants?.map((v) => v.color) || [];
  const images = (product.images || []).map(normalizeDriveLink);

  // 🔸 Botón de WhatsApp
  const handleWhatsApp = () => {
    const url = window.location.href;
    const name = product.name || "Producto sin nombre";
    const price = product.price_cop
      ? `$${Number(product.price_cop).toLocaleString("es-CO")}`
      : "Precio no disponible";

    const message = encodeURIComponent(
      `¡Hola!  Estoy interesado en el producto *${name}*.\n\n` +
      ` Color: ${selectedColor || "No seleccionado"}\n` +
      ` Talla: ${selectedSize || "No seleccionada"}\n` +
      ` Precio: ${price}\n\n`
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="container product-detail-container">
      <div className="product-detail-grid">
        {/* 🖼 Galería de imágenes */}
        <div className="product-detail-image">
          <img
            src={mainImage || "https://via.placeholder.com/400x400?text=No+Image"}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/400x400?text=No+Image";
            }}
          />

          {images.length > 1 && (
            <div className="product-thumbnails">
              {images.map((img, i) => (
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

        {/* ℹ️ Información del producto */}
        <div className="product-detail-info">
          <h2 className="product-detail-title">{product.name}</h2>
          <p className="product-detail-description">
            {product.description || "Sin descripción disponible."}
          </p>
          <p className="product-detail-price">
            {product.price_cop
              ? `$${Number(product.price_cop).toLocaleString("es-CO")}`
              : "Precio no disponible"}
          </p>

          <ul className="product-extra-info">
            <li><strong>Marca:</strong> {product.brand || "—"}</li>
            <li><strong>Categoría:</strong> {product.category || "—"}</li>
            <li><strong>Subcategoría:</strong> {product.subcategory || "—"}</li>
            <li><strong>Departamento:</strong> {product.department || "—"}</li>
            <li><strong>Peso:</strong> {product.weight_g || "—"} gr</li>
            <li><strong>Garantía:</strong> {product.warranty || "—"}</li>
            <li><strong>Materiales:</strong> {product.materials || "—"}</li>
            <li><strong>Cuidados:</strong> {product.care_instructions || "—"}</li>
          </ul>

          {/* 🎨 Selector de color */}
          {availableColors.length > 0 && (
            <div className="product-detail-option">
              <label htmlFor="color">Color:</label>
              <select
                id="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setSelectedSize("");
                }}
                className="browser-default"
              >
                <option value="">Selecciona un color</option>
                {availableColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 📏 Selector de talla */}
          {sizesForColor.length > 0 && (
            <div className="product-detail-option">
              <label htmlFor="size">Talla:</label>
              <select
                id="size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="browser-default"
              >
                <option value="">Selecciona una talla</option>
                {sizesForColor.map((s) => (
                  <option
                    key={s.size}
                    value={s.size}
                    disabled={s.stock <= 0}
                  >
                    {s.size} {s.stock <= 0 ? "(Agotado)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 🛒 Botones */}
          <div className="product-detail-actions">
            <button
              className="btn add-to-cart-btn"
              disabled={!selectedColor || !selectedSize}
              onClick={handleAddToCart}
            >
              Agregar al carrito
            </button>
            <button
              className="btn buy-now-btn"
              disabled={!selectedColor || !selectedSize}
              onClick={handleBuyNow}
            >
              Comprar ahora
            </button>
            {/* 💬 WhatsApp */}
            <button
              className="btn whatsapp-btn"
              onClick={handleWhatsApp}
            >
              💬 Consultar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
