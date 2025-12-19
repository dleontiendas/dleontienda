// src/components/ProductList.jsx
import React, { useMemo, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { ProductsContext } from "../../context/ProductContext";
import "./ProductList.css";

/* ---------- Helpers ---------- */
const isHttp = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

/* Normaliza: minúsculas + sin acentos */
const normalizeText = (s = "") =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* --- Google Drive helpers --- */
const parseDriveId = (urlOrId = "") => {
  const s = String(urlOrId).trim();
  const m =
    s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : s;
};

const DEPARTMENT_LABELS = {
  mujer: "Mujer",
  hombre: "Hombre",
  niña: "Niña",
  niño: "Niño",
  infantil: "Infantil",
  complementos: "Complementos",
  otros: "Otros",
};

/* Candidatos de imágenes por slug (con y sin tilde) */
const DEPARTMENT_IMAGE_SOURCES = (slug) => {
  switch (slug) {
    case "mujer":
      return ["/images/departments/mujer.jpg", "/images/departments/otros.jpg"];
    case "hombre":
      return ["/images/departments/hombre.jpg", "/images/departments/otros.jpg"];
    case "niña":
      return [
        "/images/departments/nina.jpg",   // sin tilde
        "/images/departments/niña.jpg",   // con tilde
        "/images/departments/infantil.jpg",
        "/images/departments/otros.jpg",
      ];
    case "niño":
      return [
        "/images/departments/nino.jpg",   // sin tilde
        "/images/departments/niño.jpg",   // con tilde
        "/images/departments/infantil.jpg",
        "/images/departments/otros.jpg",
      ];
    case "infantil":
      return [
        "/images/departments/infantil.jpg",
        "/images/departments/ninos.jpg",  // opcional si existe
        "/images/departments/otros.jpg",
      ];
    case "complementos":
      return ["/images/departments/otros.jpg"];
    default:
      return ["/images/departments/otros.jpg"];
  }
};

/* Mini-componente <img> con fallbacks */
function DepartmentChipImage({ slug, alt }) {
  const candidates = DEPARTMENT_IMAGE_SOURCES(slug);
  const idxRef = useRef(0);
  const [src, setSrc] = useState(candidates[0]);

  const handleError = () => {
    const next = idxRef.current + 1;
    if (next < candidates.length) {
      idxRef.current = next;
      setSrc(candidates[next]);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={handleError}
    />
  );
}

const getDepartmentImage = (slug) => {
  const list = DEPARTMENT_IMAGE_SOURCES(slug);
  return list[0] || "/images/departments/otros.jpg";
};

const driveView = (urlOrId) =>
  `https://drive.google.com/uc?export=view&id=${parseDriveId(urlOrId)}`;
const driveThumb = (urlOrId, w = 1600) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(urlOrId)}`;
const driveLH3 = (urlOrId, w = 1600) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(urlOrId)}=w${w}`;
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

/* -------- Slug de departamento: soporta singular/plural y sin acentos -------- */
const depToSlug = (p) => {
  const d = normalizeText(p?.department || "");

  if (d.includes("mujer") || d.includes("dama") || d.includes("damas") || d.includes("women"))
    return "mujer";
  if (d.includes("hombre") || d.includes("caballero") || d.includes("caballeros") || d.includes("men"))
    return "hombre";

  if (d.includes("nina") || d.includes("ninas") || d.includes("girl") || d.includes("girls"))
    return "niña";
  if (d.includes("nino") || d.includes("ninos") || d.includes("boy") || d.includes("boys"))
    return "niño";

  if (d.includes("infantil") || d.includes("kids")) return "infantil";
  if (d.includes("complement") || d.includes("accesorio")) return "complementos";

  return "otros";
};

const sizesOf = (variants = []) =>
  variants
    .flatMap((v) => (v.tallas || v.sizes || []).map((s) => s?.size))
    .filter(Boolean);

const colorsOf = (variants = []) =>
  variants.map((v) => v?.color).filter(Boolean);

const getPrice = (p) => {
  const n = Number(p?.price_cop);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const firstVariantImage = (variants = []) => {
  for (const v of variants) {
    if (Array.isArray(v?.images) && v.images.length && v.images[0]) {
      return v.images[0];
    }
  }
  return null;
};

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

  (Array.isArray(product?.images) ? product.images : []).forEach(pushUrl);
  (Array.isArray(product?.variants) ? product.variants : []).forEach((v) => {
    (Array.isArray(v?.images) ? v.images : []).forEach(pushUrl);
  });

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
  const PLACEHOLDER = "https://placehold.co/600x800?text=Sin+Imagen";

  const [idx, setIdx] = useState(0);
  const fbIdxRef = useRef(0);
  const [src, setSrc] = useState(images[0]?.fallbacks?.[0] || PLACEHOLDER);

  const touchStartX = useRef(null);

  const primarySignature = useMemo(
    () => images.map((i) => i.primary).join("|"),
    [images]
  );

  React.useEffect(() => {
    fbIdxRef.current = 0;
    setIdx(0);
    setSrc(images[0]?.fallbacks?.[0] || PLACEHOLDER);
  }, [primarySignature]);

  const goTo = (newIdx) => {
    if (!images.length) return;
    const n = ((newIdx % images.length) + images.length) % images.length;
    setIdx(n);
    fbIdxRef.current = 0;
    setSrc(images[n]?.fallbacks?.[0] || PLACEHOLDER);
  };

  const onError = () => {
    const fallbacks = images[idx]?.fallbacks || [];
    const nextFb = fbIdxRef.current + 1;
    if (nextFb < fallbacks.length) {
      fbIdxRef.current = nextFb;
      setSrc(fallbacks[nextFb]);
      return;
    }
    setSrc(PLACEHOLDER);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    const sx = touchStartX.current;
    const ex = e.changedTouches?.[0]?.clientX ?? null;
    touchStartX.current = null;
    if (sx == null || ex == null) return;
    const dx = ex - sx;
    if (Math.abs(dx) < 30) return;
    if (dx < 0) goTo(idx + 1);
    else goTo(idx - 1);
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

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pc-arrow pc-arrow--left"
                  aria-label="Imagen anterior"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(idx - 1);
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="pc-arrow pc-arrow--right"
                  aria-label="Imagen siguiente"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(idx + 1);
                  }}
                >
                  ›
                </button>
              </>
            )}

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
              <small>
                Colores: {colors.length ? colors.join(", ") : "N/A"}
              </small>
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
      const label =
        p.department || DEPARTMENT_LABELS[s] || (s === "otros" ? "Otros" : s);
      if (!bySlug.has(s)) bySlug.set(s, { label, count: 0 });
      bySlug.get(s).count++;
    }
    const order = ["mujer", "hombre", "niña", "niño", "infantil", "complementos", "otros"];
    return Array.from(bySlug.entries())
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([key, v]) => ({ key, label: v.label, count: v.count }));
  }, [enriched]);

  const [dep, setDep] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [sort, setSort] = useState("");

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
            className={`gender-chip gender-chip--image ${
              dep === key ? "gender-chip--active" : ""
            }`}
            onClick={() => {
              setDep(key);
              setSubFilter("");
            }}
          >
            {/* IMG con fallbacks entre nino/nina con/ sin tilde */}
            <DepartmentChipImage slug={key} alt={DEPARTMENT_LABELS[key] || label} />

            <span className="gender-chip-label">
              {DEPARTMENT_LABELS[key] || label}{" "}
              <span className="count">({count})</span>
            </span>
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
                      departmentChips.find((d) => d.key === dep)?.label ||
                      DEPARTMENT_LABELS[dep] ||
                      ""
                    }`
                  : ""}
              </h5>
            </div>
            <div className="col s12 m4 right-align">
              <label htmlFor="sort" className="sort-label">
                Ordenar:
              </label>
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
                          className={`subcat-link ${
                            subFilter === s ? "active" : ""
                          }`}
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
          sorted.map((p) => (
            <ProductCard key={`${p.catSlug}-${p.id}`} product={p} />
          ))
        ) : (
          <p className="center-align">No se encontraron productos</p>
        )}
      </div>
    </div>
  );
}
