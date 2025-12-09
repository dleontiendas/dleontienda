// src/components/ProductList.jsx
import React, { useMemo, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { ProductsContext } from "../../context/ProductContext";
import "./ProductList.css";

/* ---------- Helpers ---------- */
const isHttp = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

/* --- Google Drive helpers --- */
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
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(urlOrId)}`;

const driveLH3 = (urlOrId, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(urlOrId)}=w${w}`;

/* URLs a probar en orden */
const driveFallbackSrc = (urlOrId) => {
  const id = parseDriveId(urlOrId);
  return [driveLH3(id), driveThumb(id), driveView(id)];
};

const resolveImage = (img) => {
  if (!img) return null;
  if (/drive\.google\.com/.test(img)) return driveFallbackSrc(img);
  if (isHttp(img)) return [img];
  return null;
};

const depToSlug = (p) => {
  const d = (p?.department || "").toLowerCase();
  if (d.includes("hombre") || d.includes("caballero") || d.includes("men")) return "hombre";
  if (d.includes("mujer") || d.includes("dama") || d.includes("women")) return "mujer";
  if (d.includes("infantil") || d.includes("niño") || d.includes("nina") || d.includes("kids")) return "infantil";
  if (d.includes("complement") || d.includes("accesorio")) return "complementos";
  return "otros";
};

const sizesOf = (variants = []) =>
  variants.flatMap((v) => (v.tallas || v.sizes || []).map((s) => s?.size)).filter(Boolean);

const colorsOf = (variants = []) => variants.map((v) => v?.color).filter(Boolean);

/* Precio actual numérico. Retorna null cuando no hay precio válido. */
const getPrice = (p) => {
  const n = Number(p?.price_cop);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* ✅ Tomar primera imagen disponible de variantes cuando no hay generales */
const firstVariantImage = (variants = []) => {
  for (const v of variants) {
    if (Array.isArray(v?.images) && v.images.length && v.images[0]) {
      return v.images[0];
    }
  }
  return null;
};

/* ✅ Mezcla imágenes generales + variantes (sin duplicados) como items con fallbacks */
const collectImages = (product, limit = 8) => {
  const pool = [];
  const pushUrl = (url) => {
    if (!url) return;
    const fall = resolveImage(url);
    if (!fall || !fall.length) return;
    const primary = fall[0];
    if (!primary) return;
    if (!pool.some((it) => it.primary === primary)) {
      pool.push({ primary, fallbacks: fall });
    }
  };

  // 1) Generales primero
  (Array.isArray(product?.images) ? product.images : []).forEach(pushUrl);

  // 2) Variantes luego
  (Array.isArray(product?.variants) ? product.variants : []).forEach((v) => {
    (Array.isArray(v?.images) ? v.images : []).forEach(pushUrl);
  });

  // 3) Fallback si quedó vacío
  if (!pool.length) {
    const fallback = firstVariantImage(product?.variants) || null;
    if (fallback) pushUrl(fallback);
  }
  if (!pool.length) {
    pool.push({
      primary: "https://placehold.co/600x800?text=Sin+Imagen",
      fallbacks: ["https://placehold.co/600x800?text=Sin+Imagen"],
    });
  }

  return pool.slice(0, limit);
};

/* ---------- Product Card ---------- */
const ProductCard = ({ product }) => {
  const images = collectImages(product);
  const [idx, setIdx] = useState(0);
  const [src, setSrc] = useState(images[0]?.primary);
  const [fallbacks, setFallbacks] = useState(images[0]?.fallbacks || []);
  const touchStartX = useRef(null);

  // Si cambian las imágenes (producto nuevo), re-inicializa
  React.useEffect(() => {
    const first = images[0];
    setIdx(0);
    setSrc(first?.primary);
    setFallbacks(first?.fallbacks || []);
  }, [product?.id]); // depende del producto

  const goTo = (newIdx) => {
    const n = ((newIdx % images.length) + images.length) % images.length;
    setIdx(n);
    setSrc(images[n].primary);
    setFallbacks(images[n].fallbacks);
  };

  const onError = () => {
    const i = fallbacks.indexOf(src);
    const next = i + 1;
    if (next < fallbacks.length) {
      setSrc(fallbacks[next]);
    } else {
      // pasa a la siguiente imagen del carrusel
      if (images.length > 1) {
        const nxt = (idx + 1) % images.length;
        goTo(nxt);
      } else {
        setSrc("https://placehold.co/600x800?text=Sin+Imagen");
      }
    }
  };

  // Swipe móvil
  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    const sx = touchStartX.current;
    const ex = e.changedTouches?.[0]?.clientX ?? null;
    touchStartX.current = null;
    if (sx == null || ex == null) return;
    const dx = ex - sx;
    if (Math.abs(dx) < 30) return; // umbral
    if (dx < 0) goTo(idx + 1); // swipe izquierda → siguiente
    else goTo(idx - 1);        // swipe derecha → anterior
  };

  const sizes = [...new Set(sizesOf(product.variants))];
  const colors = [...new Set(colorsOf(product.variants))];

  return (
    <div className="col s12 m6 l4 xl3">
      <div className="card product-card-airbnb">
        <Link
          to={`/products/${product.catSlug || "sin_categoria"}/${product.id}`}
          className="product-card-link"
        >
          <div
            className="card-image product-card-image-wrapper"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={src}
              alt={product.name || "Sin nombre"}
              className="product-image"
              onError={onError}
            />

            {/* Dots navegación */}
            {images.length > 1 && (
              <div className="pc-dots" aria-label="Cambiar imagen">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pc-dot ${i === idx ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(i);
                    }}
                    aria-label={`Imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card-content product-card-content">
            <h6 className="product-name">{product.name || "Sin nombre"}</h6>

            <p className="product-price">
              {getPrice(product) !== null ? (
                <>
                  {(() => {
                    const price = getPrice(product) ?? 0;
                    const old = Number(product.price_old) || 0;
                    const pct =
                      product?.discount != null
                        ? Number(product.discount)
                        : old > price
                        ? Math.round((1 - price / old) * 100)
                        : null;

                    return (
                      <>
                        <span className="price-pill">
                          <span className="currency">$</span>
                          <span className="amount">
                            {price.toLocaleString("es-CO")}
                          </span>
                          {pct > 0 && (
                            <span className="save">AHORRA {pct}%</span>
                          )}
                        </span>
                        {old > price && (
                          <span className="price-strike">
                            ${old.toLocaleString("es-CO")}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                "Precio no disponible"
              )}
            </p>

            <p className="product-sizes">
              <small>Tallas: {sizes.length ? sizes.join(", ") : "N/A"}</small>
            </p>

            <p className="product-colors">
              <small>Colores: {colors.length ? colors.join(", ") : "N/A"}</small>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
export default function ProductList() {
  const { products, loading, error } = useContext(ProductsContext);

  const enriched = useMemo(
    () => products.map((p) => ({ ...p, depSlug: depToSlug(p) })),
    [products]
  );

  const departmentChips = useMemo(() => {
    const bySlug = new Map();
    for (const p of enriched) {
      const s = p.depSlug || "otros";
      const label = p.department || (s === "otros" ? "Otros" : s);
      if (!bySlug.has(s)) bySlug.set(s, { label, count: 0 });
      bySlug.get(s).count++;
    }
    const order = ["mujer", "hombre", "infantil", "complementos", "otros"];
    return Array.from(bySlug.entries())
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([key, v]) => ({ key, label: v.label, count: v.count }));
  }, [enriched]);

  const [dep, setDep] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [sort, setSort] = useState(""); // "" | "price_asc" | "price_desc"

  const subcatGroups = useMemo(() => {
    const base = enriched.filter((p) => !dep || p.depSlug === dep);
    const map = new Map();

    for (const p of base) {
      const cat = p.category || "Otros";
      if (!map.has(cat)) map.set(cat, new Set());
      if (p.subcategory) map.get(cat).add(p.subcategory);
    }

    return Array.from(map.entries())
      .map(([category, set]) => ({
        category,
        subcats: Array.from(set).sort(),
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [enriched, dep]);

  const filtered = useMemo(() => {
    return enriched.filter((p) => {
      const okDep = !dep || p.depSlug === dep;
      const okSub =
        !subFilter ||
        (p.subcategory || "").toLowerCase() === subFilter.toLowerCase();
      return okDep && okSub;
    });
  }, [enriched, dep, subFilter]);

  /* Ordenamiento por precio */
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const arr = [...filtered];
    const tieBreak = (a, b) => {
      const an = (a.name || "").localeCompare(b.name || "");
      if (an !== 0) return an;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    };
    const cmpAsc = (a, b) => {
      const pa = getPrice(a);
      const pb = getPrice(b);
      if (pa === null && pb === null) return tieBreak(a, b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa === pb ? tieBreak(a, b) : pa - pb;
    };
    const cmpDesc = (a, b) => -cmpAsc(a, b);
    arr.sort(sort === "price_asc" ? cmpAsc : cmpDesc);
    return arr;
  }, [filtered, sort]);

  if (loading) return <p className="center-align">Cargando productos...</p>;
  if (error) return <p className="center-align red-text">Error: {error}</p>;

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">Productos</h4>

      {/* Chips por departamento */}
      <div className="gender-filters">
        <button
          className={`gender-chip ${dep === "" ? "gender-chip--active" : ""}`}
          onClick={() => {
            setDep("");
            setSubFilter("");
          }}
        >
          Todos <span className="count">({products.length})</span>
        </button>

        {departmentChips.map(({ key, label, count }) => (
          <button
            key={key}
            className={`gender-chip ${dep === key ? "gender-chip--active" : ""}`}
            onClick={() => {
              setDep(key);
              setSubFilter("");
            }}
          >
            {label} <span className="count">({count})</span>
          </button>
        ))}
      </div>

      {/* Barra de controles: subcats + orden */}
      {subcatGroups.length > 0 && (
        <>
          <div className="controls-row row" style={{ alignItems: "center" }}>
            <div className="col s12 m8">
              <h5 className="subcat-heading">
                Explora por subcategoría{" "}
                {dep
                  ? `— ${
                      departmentChips.find((d) => d.key === dep)?.label || ""
                    }`
                  : ""}
              </h5>
            </div>
            <div className="col s12 m4 right-align">
              <label htmlFor="sort" className="sort-label">Ordenar:</label>
              <select
                id="sort"
                className="browser-default sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar productos por precio"
              >
                <option value="">Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          <div className="row subcat-grid">
            {subcatGroups.map((g) => (
              <div className="col s12 m6 l4 xl3" key={g.category}>
                <div className="subcat-card text-only card-border">
                  <h6 className="subcat-title">{g.category}</h6>

                  <ul className="subcat-list">
                    {g.subcats.slice(0, 12).map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          className={`subcat-link ${subFilter === s ? "active" : ""}`}
                          onClick={() => setSubFilter(subFilter === s ? "" : s)}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Grilla */}
      <div className="product-grid">
        {sorted.length ? (
          sorted.map((p) => <ProductCard key={`${p.catSlug}-${p.id}`} product={p} />)
        ) : (
          <p className="center-align">No se encontraron productos</p>
        )}
      </div>
    </div>
  );
}
