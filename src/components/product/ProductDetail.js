import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";
import { CartContext } from "../../context/CartContext";
import "materialize-css/dist/css/materialize.min.css";
import "./ProductDetail.css";

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER;


// 🔹 Normalizar imágenes de Drive
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
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizesForColor, setSizesForColor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useContext(CartContext);

  // 🔸 Cargar producto desde cualquier subcolección "items"
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collectionGroup(db, "items"));
        let foundProduct = null;

        snapshot.forEach((docSnap) => {
          if (docSnap.id === productId) {
            foundProduct = { id: docSnap.id, ...docSnap.data() };
          }
        });

        if (foundProduct) {
          setProduct(foundProduct);
          const imgs = (foundProduct.images || []).map(normalizeDriveLink);
          if (imgs.length > 0) setMainImage(imgs[0]);
        } else {
          setError("Producto no encontrado");
        }
      } catch (err) {
        console.error("❌ Error cargando producto:", err);
        setError("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // 🔹 Filtrar tallas por color
  useEffect(() => {
    if (selectedColor && product?.variants) {
      const variant = product.variants.find((v) => v.color === selectedColor);
      setSizesForColor(variant ? variant.sizes : []);
    }
  }, [selectedColor, product]);

  if (loading) return <p className="center">Cargando producto...</p>;
  if (error) return <p className="red-text center">{error}</p>;
  if (!product) return null;

  const availableColors = product.variants?.map((v) => v.color) || [];
  const images = (product.images || []).map(normalizeDriveLink);

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
    navigate("/checkout");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola! Estoy interesado en el producto *${product.name}*.\n` +
        `Color: ${selectedColor || "No seleccionado"}\n` +
        `Talla: ${selectedSize || "No seleccionada"}\n` +
        `Precio: $${Number(product.price_cop).toLocaleString("es-CO")}\n\n` +
        `${window.location.href}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <div className="container section product-detail">
      <div className="row">
        {/* 📸 Galería lateral */}
        <div className="col s2 hide-on-small-only">
          <ul className="collection product-thumbs">
            {images.map((img, i) => (
              <li
                key={i}
                className={`collection-item ${
                  mainImage === img ? "active-thumb" : ""
                }`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt={`thumb-${i}`} className="responsive-img" />
              </li>
            ))}
          </ul>
        </div>

        {/* 🖼 Imagen principal */}
        <div className="col s12 m5 center">
          <img
            src={
              mainImage ||
              "https://via.placeholder.com/400x400?text=No+Image"
            }
            alt={product.name}
            className="responsive-img z-depth-2"
            style={{
              borderRadius: "10px",
              maxHeight: "800px",
              objectFit: "contain",
            }}
          />
        </div>

        {/* ℹ️ Info del producto */}
        <div className="col s12 m5">
          <h5 className="gold-text">{product.name}</h5>
          <h4 className="price-text">
            ${Number(product.price_cop).toLocaleString("es-CO")}
          </h4>
          <p>{product.description}</p>

          {/* Opciones */}
          {availableColors.length > 0 && (
            <div className="input-field">
              <select
                className="browser-default"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setSelectedSize("");
                }}
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

          {sizesForColor.length > 0 && (
            <div className="input-field">
              <select
                className="browser-default"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Selecciona una talla</option>
                {sizesForColor.map((s) => (
                  <option key={s.size} value={s.size} disabled={s.stock <= 0}>
                    {s.size} {s.stock <= 0 ? "(Agotado)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botones */}
          <div className="btn-group" style={{ marginTop: "20px" }}>
            <button
              className="btn amber darken-2 waves-effect"
              onClick={handleAddToCart}
              disabled={!selectedColor || !selectedSize}
            >
              Agregar al carrito
            </button>
            <button
              className="btn green darken-2 waves-effect"
              onClick={handleBuyNow}
              disabled={!selectedColor || !selectedSize}
              style={{ marginLeft: "10px" }}
            >
              Comprar ahora
            </button>
            <button
              className="btn blue darken-1 waves-effect"
              onClick={handleWhatsApp}
              style={{ marginLeft: "10px" }}
            >
              Consultar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* 🧾 Información adicional */}
      <div className="row" style={{ marginTop: "40px" }}>
        <div className="col s12 text-left">
          <ul className="collection with-header">
            <li className="collection-header">
              <h6>Detalles del producto</h6>
            </li>
            <li className="collection-item">Marca: {product.brand || "—"}</li>
            <li className="collection-item">
              Categoría: {product.category || "—"}
            </li>
            <li className="collection-item">
              Subcategoría: {product.subcategory || "—"}
            </li>
            <li className="collection-item">
              Peso: {product.weight_grams || "—"} g
            </li>
            <li className="collection-item">
              Garantía: {product.warranty || "—"}
            </li>
            <li className="collection-item">
              Materiales: {product.materials || "—"}
            </li>
            <li className="collection-item">
              Cuidados: {product.care_instructions || "—"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
