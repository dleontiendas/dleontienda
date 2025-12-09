// src/components/RandomProductsCarousel.js
import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductsContext } from "../../../context/ProductContext";
import "./RandomProductsCarousel.css";

/* ===== Helpers compatibles con tu ProductList ===== */
const isHttp = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const parseDriveId = (urlOrId = "") => {
  const s = String(urlOrId).trim();
  const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : s;
};
const driveView = (id) => `https://drive.google.com/uc?export=view&id=${parseDriveId(id)}`;
const driveThumb = (id, w = 1200) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(id)}`;
const driveLH3 = (id, w = 1200) => `https://lh3.googleusercontent.com/d/${parseDriveId(id)}=w${w}`;
const resolveImage = (img) => {
  if (!img) return null;
  if (/drive\.google\.com/.test(img)) {
    const id = parseDriveId(img);
    return [driveLH3(id), driveThumb(id), driveView(id)];
  }
  if (isHttp(img)) return [img];
  return null;
};
const firstVariantImage = (variants = []) => {
  for (const v of variants) {
    if (Array.isArray(v?.images) && v.images.length && v.images[0]) return v.images[0];
  }
  return null;
};
const collectImages = (product) => {
  const pool = [];
  const pushUrl = (url) => {
    if (!url) return;
    const fall = resolveImage(url);
    if (!fall || !fall.length) return;
    const primary = fall[0];
    if (!pool.some((it) => it.primary === primary)) pool.push({ primary, fallbacks: fall });
  };
  (Array.isArray(product?.images) ? product.images : []).forEach(pushUrl);
  (Array.isArray(product?.variants) ? product.variants : []).forEach((v) => {
    (Array.isArray(v?.images) ? v.images : []).forEach(pushUrl);
  });
  if (!pool.length) {
    const fb = firstVariantImage(product?.variants);
    if (fb) pushUrl(fb);
  }
  if (!pool.length) {
    pool.push({
      primary: "https://placehold.co/600x800?text=Sin+Imagen",
      fallbacks: ["https://placehold.co/600x800?text=Sin+Imagen"],
    });
  }
  return pool;
};
const getPrice = (p) => {
  const n = Number(p?.price_cop);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const depToSlug = (p) => {
  const d = (p?.department || "").toLowerCase();
  if (d.includes("hombre") || d.includes("caballero") || d.includes("men")) return "hombre";
  if (d.includes("mujer") || d.includes("dama") || d.includes("women")) return "mujer";
  if (d.includes("infantil") || d.includes("niño") || d.includes("nina") || d.includes("kids")) return "infantil";
  if (d.includes("complement") || d.includes("accesorio")) return "complementos";
  return "otros";
};
const pickRandom = (arr, limit = 12) => {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, limit);
};

/* ===== Tarjeta ===== */
function CarouselCard({ p }) {
  const imgs = collectImages(p);
  const [src, setSrc] = useState(imgs[0].primary);
  const [fallbacks, setFallbacks] = useState(imgs[0].fallbacks);

  useEffect(() => {
    setSrc(imgs[0].primary);
    setFallbacks(imgs[0].fallbacks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  const onError = () => {
    const i = fallbacks.indexOf(src);
    const n = i + 1;
    if (n < fallbacks.length) setSrc(fallbacks[n]);
    else setSrc("https://placehold.co/600x800?text=Sin+Imagen");
  };

  const price = getPrice(p);
  const cat = p.catSlug || depToSlug(p) || "sin_categoria";
  const pid = p.id || p.sku || "";
  return (
    <div className="rpc-card">
      <Link to={`/products/${cat}/${pid}`} className="rpc-link">
        <div className="rpc-imgwrap">
          <img src={src} onError={onError} alt={p.name || "Producto"} className="rpc-img" />
        </div>
        <div className="rpc-body">
          <div className="rpc-name">{p.name || "Sin nombre"}</div>
          <div className="rpc-price">
            {price !== null ? `$${price.toLocaleString("es-CO")}` : "—"}
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ===== Carrusel ===== */
export default function RandomProductsCarousel({
  title = "Te puede interesar",
  limit = 12,
  autoplay = true,
  interval = 5000,
  filter, // opcional: (p) => boolean
  showWhenEmpty = true, // renderizar aunque no haya items
}) {
  const { products = [], loading, error } = useContext(ProductsContext) || {};

  const baseList = useMemo(() => {
    const arr = Array.isArray(products) ? products : [];
    const filtered = typeof filter === "function" ? arr.filter(filter) : arr;
    // No filtres por imágenes aquí para no vaciar el carrusel; lo resolvemos en la tarjeta.
    return filtered;
  }, [products, filter]);

  const items = useMemo(() => pickRandom(baseList, limit), [baseList, limit]);

  // responsive perView
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth || 1200;
      const cardW = w <= 520 ? 0.68 * w : 240;
      const gap = 14;
      const n = Math.max(1, Math.floor((w - 32) / (cardW + gap)));
      setPerView(n);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const pages = Math.max(1, Math.ceil((items.length || 1) / perView));
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);

  const scrollToPage = (p) => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.max(0, Math.min(p, pages - 1));
    setPage(i);
    // desplaza por ancho real del carril
    const child = el.querySelector(".rpc-slide");
    const slideW = child ? child.getBoundingClientRect().width : 240;
    const style = window.getComputedStyle(el);
    const gapPx = parseFloat(style.columnGap || style.gap || "14") || 14;
    const x = i * (slideW + gapPx) * perView;
    el.scrollTo({ left: x, behavior: "smooth" });
  };
  const next = () => scrollToPage(page + 1);
  const prev = () => scrollToPage(page - 1);

  // autoplay
  useEffect(() => {
    if (!autoplay || pages <= 1) return;
    const id = setInterval(() => {
      setPage((p) => {
        const n = (p + 1) % pages;
        scrollToPage(n);
        return n;
      });
    }, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, autoplay, interval]);

  // drag/swipe
  const drag = useRef({ active: false, startX: 0, scroll: 0 });
  const onDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: (e.touches ? e.touches[0].clientX : e.clientX),
      scroll: el.scrollLeft,
    };
    el.classList.add("rpc-grabbing");
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const el = trackRef.current;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = drag.current.startX - x;
    el.scrollLeft = drag.current.scroll + dx;
  };
  const onUp = () => {
    const el = trackRef.current;
    if (!el) return;
    drag.current.active = false;
    el.classList.remove("rpc-grabbing");
  };

  // Debug que te ayuda a ver por qué no aparece
  useEffect(() => {
    console.debug("[RandomProductsCarousel] loading:", loading, "error:", error);
    console.debug("[RandomProductsCarousel] products:", products?.length || 0);
    console.debug("[RandomProductsCarousel] items(picked):", items?.length || 0);
  }, [loading, error, products, items]);

  // Render SIEMPRE (skeleton/empty state)
  return (
    <section className="rpc-wrap">
      <div className="rpc-head">
        <h3 className="rpc-title">{title}</h3>
        <div className="rpc-controls">
          <button className="rpc-nav" onClick={prev} aria-label="Anterior">‹</button>
          <button className="rpc-nav" onClick={next} aria-label="Siguiente">›</button>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="rpc-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="rpc-skel-card" key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rpc-empty">No se pudo cargar el carrusel.</div>
      )}

      {!loading && !error && items.length === 0 && showWhenEmpty && (
        <div className="rpc-empty">No hay productos para mostrar.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div
            className="rpc-track"
            ref={trackRef}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseLeave={onUp}
            onMouseUp={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          >
            {items.map((p) => (
              <div className="rpc-slide" key={`${p.catSlug || depToSlug(p)}-${p.id}`}>
                <CarouselCard p={p} />
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="rpc-dots">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  className={`rpc-dot ${i === page ? "active" : ""}`}
                  onClick={() => scrollToPage(i)}
                  aria-label={`Ir a página ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
