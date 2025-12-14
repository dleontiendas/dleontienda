// FILE: src/components/product/ProductDetail.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { doc, getDoc, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { db } from "../../Firebase";
import { CartContext } from "../../context/CartContext";
import "materialize-css/dist/css/materialize.min.css";
import "./ProductDetail.css";
import RandomProductsCarousel from "./carrousel/RandomProductsCarousel";

const env = (vite, cra) =>
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[vite]) ||
  (typeof process !== "undefined" && process.env && process.env[cra]) || "";

const WHATSAPP_NUMBER =
  env("VITE_WPP_NUMBER_STORE", "REACT_APP_WHATSAPP_NUMBER") || "573104173201";

const parseDriveId = (urlOrId = "") => {
  const s = String(urlOrId).trim();
  const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : s;
};

const driveView = (urlOrId) =>
  `https://drive.google.com/uc?export=view&id=${parseDriveId(urlOrId)}`;

const driveThumb = (urlOrId, w = 1600) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(urlOrId)}`;

const driveLH3 = (urlOrId, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(urlOrId)}=w${w}`;

const resolveDriveImage = (img) => {
  if (!img) return null;
  if (!/drive\.google\.com/.test(img)) return [img];
  const id = parseDriveId(img);
  return [driveLH3(id), driveThumb(id), driveView(id)];
};

const getVariants = (p) => (Array.isArray(p?.variants) ? p.variants : []);
const getSizesArr = (v) =>
  (Array.isArray(v?.tallas) ? v.tallas : Array.isArray(v?.sizes) ? v.sizes : []) || [];
const firstAvailable = (sizes) => sizes.find((s) => Number(s?.stock) > 0) || sizes[0] || null;

const getVariantImagesForColor = (product, color) => {
  if (!product || !color) return [];
  const v = getVariants(product).find((x) => (x?.color || "") === color);
  const arr = Array.isArray(v?.images) ? v.images : [];
  return arr.filter(Boolean);
};

const toAbsoluteUrl = (maybeUrl) => {
  try {
    return new URL(maybeUrl, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

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

        const firstGeneral = (data.images || [])[0];
        const fallbackArr =
          resolveDriveImage(firstGeneral) ||
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

  const thumbItems = useMemo(() => {
    if (!product) return [];
    const variantImgs = getVariantImagesForColor(product, selectedColor);
    const generalImgs = Array.isArray(product.images) ? product.images : [];
    const ordered = [...variantImgs, ...generalImgs];

    const seen = new Set();
    const items = [];
    for (const raw of ordered) {
      const fall = resolveDriveImage(raw);
      if (!fall || !fall.length) continue;
      const primary = fall[0];
      if (seen.has(primary)) continue;
      seen.add(primary);
      items.push({ primary, fallbacks: fall });
    }
    if (!items.length) {
      items.push({
        primary: "https://placehold.co/800x1000?text=Sin+Imagen",
        fallbacks: ["https://placehold.co/800x1000?text=Sin+Imagen"],
      });
    }
    return items;
  }, [product, selectedColor]);

  useEffect(() => {
    if (!thumbItems.length) return;
    const first = thumbItems[0];
    if (first.primary !== mainImage) {
      setMainImage(first.primary);
      setMainFallbackList(first.fallbacks);
    }
  }, [selectedColor, thumbItems]); // keep selection in sync

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

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
    navigate("/checkout");
  };

  // --- WhatsApp con hack de imagen ---
  const shareUrl = window.location.href;
  const ogImage = toAbsoluteUrl(
    mainImage || (mainFallbackList[0] ?? "https://placehold.co/800x1000?text=Sin+Imagen")
  );

  const handleWhatsApp = () => {
    // Poner la imagen primero en el mensaje
    const message = encodeURIComponent(
      `${ogImage}\n` +
        `¡Hola! Estoy interesado en *${product.name}*.\n` +
        `Color: ${selectedColor || "No seleccionado"}\n` +
        `Talla: ${selectedSize || "No seleccionada"}\n` +
        `Precio: $${Number(product.price_cop).toLocaleString("es-CO")}\n\n` +
        `${shareUrl}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  // Compartir usando Web Share API o copiar al portapapeles
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || "Producto",
          text: product?.description || "Mira este producto",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Enlace copiado al portapapeles");
      }
    } catch {
      /* UX: silencio */
    }
  };

  const canonicalUrl = toAbsoluteUrl(shareUrl);
  const price = Number(product.price_cop);

  return (
    <div className="container section product-detail">
      {/* Meta OG/Twitter dinámicos */}
      <Helmet>
        <title>{product.name} | {product.brand || "Tienda"}</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="description" content={product.description || product.name} />

        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || product.name} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Tienda" />
        {price ? <meta property="product:price:amount" content={String(price)} /> : null}
        <meta property="product:price:currency" content="COP" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={product.description || product.name} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      <div className="row">
        <nav className="crumbs-bar">
          <span>{product?.department || "—"}</span>
          <span className="sep">/</span>
          <span>{product?.category || "—"}</span>
          <span className="sep">/</span>
          <span className="current">{product?.name}</span>
        </nav>

        <div className="col s2 hide-on-small-only">
          <ul className="collection product-thumbs">
            {thumbItems.map((t, i) => (
              <li
                key={t.primary + i}
                className={`collection-item ${mainImage === t.primary ? "active-thumb" : ""}`}
                onClick={() => {
                  setMainImage(t.primary);
                  setMainFallbackList(t.fallbacks);
                }}
              >
                <img src={t.primary} alt={`thumb-${i}`} className="responsive-img" />
              </li>
            ))}
          </ul>
        </div>

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

        <div className="col s12 m5 pd-panel">
          <h5 className="pd-title">{product.name}</h5>
          <div className="pd-price">
            ${Number(product.price_cop).toLocaleString("es-CO")}
          </div>

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
                      className={`size-pill ${isSel ? "selected" : ""} ${disabled ? "disabled" : ""}`}
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

            <div className="cta-row" style={{ gap: 8, flexWrap: "wrap" }}>
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

              {/* Botón Compartir */}
              <button className="btn-outline" onClick={handleShare} aria-label="Compartir producto">
                Compartir
              </button>
            </div>
          </div>

          <div className="tip-card">
            <div className="tip-emoji">🧍‍♀️</div>
            <div>
              <div className="tip-title">¿Dudas con tu talla?</div>
              <div className="tip-text">
                Escríbenos y te ayudamos a elegir la mejor opción según tu fit.
              </div>
            </div>
          </div>

          <p className="pd-desc">{product.description}</p>
        </div>
      </div>

      <section className="pd-specs">
        <table className="spec-table">
          <tbody>
            <tr><td className="spec-name">Marca</td><td>{product.brand || "—"}</td></tr>
            <tr><td className="spec-name">Categoría</td><td>{product.category || "—"}</td></tr>
            <tr><td className="spec-name">Subcategoría</td><td>{product.subcategory || "—"}</td></tr>
            <tr><td className="spec-name">Peso</td><td>{product.weight_grams ? `${product.weight_grams} g` : "—"}</td></tr>
            <tr><td className="spec-name">Garantía</td><td>{product.warranty || "—"}</td></tr>
            <tr><td className="spec-name">Materiales</td><td>{product.materials || "—"}</td></tr>
            <tr><td className="spec-name">Cuidados</td><td>{product.care_instructions || "—"}</td></tr>
          </tbody>
        </table>
      </section>

      <RandomProductsCarousel title="También te puede gustar" limit={10} />
    </div>
  );
}
