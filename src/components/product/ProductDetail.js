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
import { Tag, Share2, Ruler, ShoppingCart, Truck, ShieldCheck, RefreshCw, Store, MessageCircle, ChevronRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { resolveProductPricing } from "../utils/productPricing";

const env = (_vite, cra) =>
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

// Devuelve la lista de fallbacks de la primera imagen disponible para un color
const resolveFirstImageForColor = (product, color) => {
  const variantImgs = getVariantImagesForColor(product, color);
  const firstRaw = variantImgs[0] || (Array.isArray(product?.images) ? product.images[0] : null);
  if (!firstRaw) return null;
  return resolveDriveImage(firstRaw) || [firstRaw];
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



  const [addiReady, setAddiReady] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (window.customElements?.get("addi-widget")) {
      setAddiReady(true);
      
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.amazonaws.com/widgets.addi.com/bundle.min.js";
    script.async = true;
    script.onload = () => setAddiReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        let data = null;

        if (category && productId) {
          const ref = doc(db, "productos", category, "items", productId);
          const snap = await getDoc(ref);
          if (snap.exists()) data = { id: snap.id, catSlug: category, ...snap.data() };
        }
        if (!data && productId) {
          const q = query(collectionGroup(db, "items"), where("sku", "==", productId));
          const cg = await getDocs(q);
          if (!cg.empty) {
            const found = cg.docs[0];
            data = { id: found.id, catSlug: found.ref.parent?.parent?.id || "sin_categoria", ...found.data() };
          }
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

  // Al cambiar color, actualizar imagen principal con la primera imagen de esa variante
  useEffect(() => {
    if (!product || !selectedColor) return;
    const fallbacks = resolveFirstImageForColor(product, selectedColor);
    if (fallbacks?.length) {
      setMainImage(fallbacks[0]);
      setMainFallbackList(fallbacks);
    }
  }, [selectedColor]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const pricing = resolveProductPricing(product, selectedColor, selectedSize);
  const price = pricing.price;
  const oldPrice = pricing.oldPrice;
  const hasDiscount = pricing.hasDiscount;
  const savings = pricing.savings;
  const savingsPercent = pricing.percentage;
  const formatPrice = (value) => `$${Number(value).toLocaleString("es-CO")}`;

  if (loading) return <p className="center">Cargando producto...</p>;
  if (error) return <p className="red-text center">{error}</p>;
  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) return;
    addToCart(product, 1, selectedSize, selectedColor);
    navigate("/checkout");
  };

  // --- WhatsApp con hack de imagen ---
  const shareUrl = (() => {
    const url = new URL(window.location.href);
    const updatedAt = product?.updated_at || product?.updatedAt;
    const version =
      updatedAt?.seconds ||
      (typeof updatedAt?.toMillis === "function" ? updatedAt.toMillis() : "1");
    // Cambiar esta revisión fuerza a las apps de mensajería a volver a
    // consultar la vista previa cuando ajustamos sus metadatos o imagen.
    url.searchParams.set("v", `${version}-2`);
    return url.toString();
  })();
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
        `Precio: ${formatPrice(price)}\n\n` +
        `${shareUrl}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  // Compartir usando Web Share API o copiar al portapapeles
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
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
  const ADDI_ALLY_SLUG = "247serviciosgold-ecommerce";
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

      <div className="pd-layout">
        <nav className="crumbs-bar">
          <span>{product?.department || "—"}</span>
          <span className="sep">/</span>
          <span>{product?.category || "—"}</span>
          <span className="sep">/</span>
          <span className="current">{product?.name}</span>
        </nav>

       <div className="pd-thumbnails">
          <ul className="product-thumbs" aria-label="Imágenes del producto">
            {thumbItems.map((t, i) => (
              <li
                key={t.primary + i}
                className={t.fallbacks.includes(mainImage) ? "active-thumb" : ""}
              >
                <button type="button" aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                aria-pressed={t.fallbacks.includes(mainImage)}
                onClick={() => {
                  setMainImage(t.primary);
                  setMainFallbackList(t.fallbacks);
                }}
              >
                <img src={t.primary} alt="" className="responsive-img" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pd-gallery">
          <img
            src={mainImage}
            alt={product.name}
            className="responsive-img main-hero"
            referrerPolicy="no-referrer"
            decoding="async"
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

          <div className="pd-panel">
            <span className="pd-web-label"><Tag size={16} aria-hidden="true" />Precio exclusivo web</span>
            <h1 className="pd-title">{product.name}</h1>
          <div className="pd-price-block">
            <div className="pd-price-line">
              <span className="pd-price">{formatPrice(price)}</span>
              {hasDiscount && <del className="pd-old-price"><span className="pd-sr-only">Precio anterior: </span>{formatPrice(oldPrice)}</del>}
            </div>
            {hasDiscount && <p className="pd-savings">Ahorras {formatPrice(savings)} ({savingsPercent}%)</p>}
          </div>
 {/* Botón Compartir */}
              <button className="btn-share" onClick={handleShare} aria-label="Compartir producto">
                <Share2 size={17} aria-hidden="true" /> Compartir
              </button>
          {colorCards.length > 0 && (
            <>
              <div className="pd-label">COLORES</div>
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
                    aria-pressed={selectedColor === c.color}
                  >
                    {/*<div className="color-thumb" />*/}
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
                  <Ruler size={17} aria-hidden="true" /> Guía de tallas
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
                      aria-pressed={isSel}
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
              <ShoppingCart size={22} aria-hidden="true" /> AÑADIR AL CARRITO{/*} •{" "}
              {product.price_cop
                ? `$${Number(product.price_cop).toLocaleString("es-CO")}`
                : "—"}*/}
            </button>

            <div className="cta-row">
              
             {/* <button
                className="btn-secondary"
                onClick={handleBuyNow}
                disabled={!selectedColor || !selectedSize}
              >
                Comprar ahora
              </button>*/}

              <button className="btn-outline" onClick={handleWhatsApp}>
                <FaWhatsapp size={24} aria-hidden="true" /> Comprar por WhatsApp
              </button>
              
              {/* ===== ADDI WIDGET (CORRECTO) ===== */}
      {addiReady && price > 0 && (
        <addi-widget
          price={price}
          ally-slug={ADDI_ALLY_SLUG}
        />
      )}

             
            </div>
          </div>

          <div className="pd-benefits" aria-label="Beneficios de compra">
            <div className="pd-benefit"><Truck aria-hidden="true" /><div><strong>Envíos nacionales</strong><p>Envíos a toda Colombia</p></div></div>
            <div className="pd-benefit"><ShieldCheck aria-hidden="true" /><div><strong>Pago seguro</strong><p>Compra segura y confiable</p></div></div>
            <div className="pd-benefit"><RefreshCw aria-hidden="true" /><div><strong>Cambios fáciles</strong><p>Consulta nuestras políticas de cambio</p></div></div>
          </div>

        </div>
      </div>

      <div className="pd-information-row">
      <section className="pd-store-benefits" aria-label="Comprar en D’LEON GOLD">
        <div><Tag aria-hidden="true" /><div><h2>MEJORES PRECIOS ONLINE</h2><p>Compra en dleongold.com y encuentra promociones exclusivas.</p></div></div>
        <div><Store aria-hidden="true" /><div><h2>ATENCIÓN EN TIENDA FÍSICA</h2><p>Visítanos y recibe asesoría personalizada.</p></div></div>
        <div className="pd-addi-benefit"><span className="pd-addi-wordmark" aria-label="Addi">Addi</span><div><h2>COMPRA CON ADDI</h2><p>Compra ahora y paga después con Addi.</p></div></div>
      </section>
      <button className="tip-card pd-size-help" type="button" onClick={handleWhatsApp}>
        <MessageCircle aria-hidden="true" />
        <span><strong className="tip-title">¿Dudas con tu talla?</strong><span className="tip-text">Escríbenos y te ayudamos a elegir la mejor opción según tu fit.</span></span>
        <ChevronRight className="pd-help-arrow" aria-hidden="true" />
      </button>
      </div>

      <p className="pd-desc">{product.description}</p>

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

      <RandomProductsCarousel title="También te puede interesar" limit={10} />
    </div>
  );
}
