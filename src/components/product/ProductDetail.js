// src/components/product/ProductDetail.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { db } from "../../Firebase";
import { CartContext } from "../../context/CartContext";
import "materialize-css/dist/css/materialize.min.css";
import "./ProductDetail.css";

const env = (vite, cra) =>
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[vite]) ||
  (typeof process !== "undefined" && process.env && process.env[cra]) || "";

const WHATSAPP_NUMBER =
  env("VITE_WPP_NUMBER_STORE", "REACT_APP_WHATSAPP_NUMBER") || "573104173201";

/* --- Google Drive helpers (versión mejorada, compatible iPhone/Safari) --- */
const parseDriveId = (urlOrId = "") => {
  const s = String(urlOrId).trim();
  const m =
    s.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : s;
};

const driveView = (urlOrId) =>
  `https://drive.google.com/uc?export=view&id=${parseDriveId(urlOrId)}`;

const driveThumb = (urlOrId, w = 1600) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(
    urlOrId
  )}`;

const driveLH3 = (urlOrId, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(urlOrId)}=w${w}`;

/* Devuelve array de fallbacks */
const resolveDriveImage = (img) => {
  if (!img) return null;
  if (!/drive\.google\.com/.test(img)) return [img];

  const id = parseDriveId(img);
  return [
    driveLH3(id),     // #1 mejor para iPhone/Safari
    driveThumb(id),   // #2 calidad media
    driveView(id)     // #3 vista pública estándar
  ];
};

const getVariants = (p) => (Array.isArray(p?.variants) ? p.variants : []);
const getSizesArr = (v) =>
  (Array.isArray(v?.tallas) ? v.tallas : Array.isArray(v?.sizes) ? v.sizes : []) || [];
const firstAvailable = (sizes) =>
  sizes.find((s) => Number(s?.stock) > 0) || sizes[0] || null;

export default function ProductDetail() {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [mainFallbackList, setMainFallbackList] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* --- Load product --- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        let data = null;

        if (category && productId) {
          const ref = doc(db, "productos", category, "items", productId);
          const snap = await getDoc(ref);
          if (snap.exists()) data = { id: snap.id, ...snap.data() };
        }
        if (!data && productId) {
          const q = query(collectionGroup(db, "items"), where("sku", "==", productId));
          const cg = await getDocs(q);
          if (!cg.empty) data = { id: cg.docs[0].id, ...cg.docs[0].data() };
        }

        if (!alive) return;
        if (!data) {
          setError("Producto no encontrado");
          return;
        }

        setProduct(data);

        const fallbackArr =
          resolveDriveImage((data.images || [])[0]) ||
          ["https://placehold.co/800x1000?text=Sin+Imagen"];

        setMainFallbackList(fallbackArr);
        setMainImage(fallbackArr[0]);

        const variants = getVariants(data);
        const v =
          variants.find((vv) => getSizesArr(vv).some((s) => Number(s.stock) > 0)) ||
          variants[0];

        if (v) {
          setSelectedColor(v.color || "");
          const s = firstAvailable(getSizesArr(v));
          if (s?.size) setSelectedSize(s.size);
        }
      } catch (e) {
        console.error("❌ Error cargando producto:", e);
        setError("Error al cargar el producto");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [category, productId]);

  /* --- All images for thumbnails --- */
  const images = useMemo(() => {
    return (product?.images || [])
      .map((img) => resolveDriveImage(img)?.[0])
      .filter(Boolean);
  }, [product]);

  const variants = useMemo(() => getVariants(product), [product]);

  const colorCards = useMemo(() => {
    return variants.map((v) => {
      const sizes = getSizesArr(v);
      const total = sizes.reduce((a, s) => a + Number(s?.stock || 0), 0);
      return { color: v.color, sizes, isOut: total <= 0 };
    });
  }, [variants]);

  const sizesForColor = useMemo(() => {
    const v = variants.find((vv) => (vv?.color || "") === selectedColor);
    return getSizesArr(v);
  }, [variants, selectedColor]);

  if (loading) return <p className="center">Cargando producto...</p>;
  if (error) return <p className="red-text center">{error}</p>;
  if (!product) return null;

  /* --- Handlers --- */
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
      `¡Hola! Estoy interesado en *${product.name}*.\n` +
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

        {/* Thumbnails */}
        <div className="col s2 hide-on-small-only">
          <ul className="collection product-thumbs">
            {images.map((img, i) => (
              <li
                key={i}
                className={`collection-item ${mainImage === img ? "active-thumb" : ""}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt={`thumb-${i}`} className="responsive-img" />
              </li>
            ))}
          </ul>
        </div>

        {/* Main image */}
        <div className="col s12 m5 center">
          <img
            src={mainImage}
            alt={product.name}
            className="responsive-img z-depth-2 main-hero"
            onError={() => {
              const i = mainFallbackList.indexOf(mainImage);
              const next = i + 1;
              if (next < mainFallbackList.length) {
                setMainImage(mainFallbackList[next]);
              } else {
                setMainImage("https://placehold.co/800x1000?text=Sin+Imagen");
              }
            }}
          />
        </div>

        {/* Right Panel */}
        <div className="col s12 m5 pd-panel">
          <nav className="crumbs hide-on-small-only">
            <span>{product.department || "—"}</span>
            <span> / </span>
            <span>{product.category || "—"}</span>
            <span> / </span>
            <span>{product.name}</span>
          </nav>

          <h5 className="pd-title">{product.name}</h5>
          <div className="pd-price">
            ${Number(product.price_cop).toLocaleString("es-CO")}
          </div>

          {/* COLOR */}
          {colorCards.length > 0 && (
            <>
              <div className="pd-label">COLOR</div>
              <div className="option-grid">
                {colorCards.map((c) => (
                  <button
                    key={c.color}
                    className={[
                      "color-card",
                      selectedColor === c.color ? "selected" : "",
                      c.isOut ? "is-out" : "",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedColor(c.color);
                      const s = firstAvailable(c.sizes);
                      setSelectedSize(s?.size || "");
                    }}
                    type="button"
                  >
                    <div className="color-thumb" />
                    <div className="color-name">{c.color}</div>
                    {c.isOut && <div className="badge-out">AGOTADO</div>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* TALLAS */}
          {sizesForColor.length > 0 && (
            <>
              <div className="pd-label size-label">
                TALLA
                <button className="size-guide" type="button">
                  🧵&nbsp;GUIA DE TALLAS
                </button>
              </div>

              <div className="size-grid">
                {sizesForColor.map((s) => {
                  const disabled = Number(s.stock) <= 0;
                  const isSel = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      className={`size-pill ${
                        isSel ? "selected" : ""
                      } ${disabled ? "disabled" : ""}`}
                      onClick={() => !disabled && setSelectedSize(s.size)}
                      disabled={disabled}
                      type="button"
                    >
                      {s.size}
                      {disabled && <span className="strike">—</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="cta-stack">
            <button
              className="btn-cta"
              onClick={handleAddToCart}
              disabled={!selectedColor || !selectedSize}
            >
              AÑADIR AL CARRITO •{" "}
              {product.price_cop
                ? `$${Number(product.price_cop).toLocaleString("es-CO")}`
                : "—"}
            </button>

            <div className="cta-row">
              <button
                className="btn-secondary"
                onClick={handleBuyNow}
                disabled={!selectedColor || !selectedSize}
              >
                Comprar ahora
              </button>

              <button className="btn-outline" onClick={handleWhatsApp}>
                Consultar por WhatsApp
              </button>
            </div>
          </div>

          {/* TIP */}
          <div className="tip-card">
            <div className="tip-emoji">🧍‍♀️</div>
            <div>
              <div className="tip-title">¿Dudas con tu talla?</div>
              <div className="tip-text">
                Escríbenos y te ayudamos a elegir la mejor opción según tu fit.
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <p className="pd-desc">{product.description}</p>

          {/* FIT BAR 
          <div className="fit-scale">
            <span>Ajustado</span>
            <div className="fit-track">
              <div className="fit-dot" />
            </div>
            <span>Amplio</span>
          </div>*/}

          {/* DETALLES */}
          <ul className="spec-list">
            <li><b>Marca:</b> {product.brand || "—"}</li>
            <li><b>Categoría:</b> {product.category || "—"}</li>
            <li><b>Subcategoría:</b> {product.subcategory || "—"}</li>
            <li><b>Peso:</b> {product.weight_grams || "—"} g</li>
            <li><b>Garantía:</b> {product.warranty || "—"}</li>
            <li><b>Materiales:</b> {product.materials || "—"}</li>
            <li><b>Cuidados:</b> {product.care_instructions || "—"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
