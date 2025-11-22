// src/components/ProductList.jsx
import React, { useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { ProductsContext } from "../../context/ProductContext";
import "./ProductList.css";

/* ---------- Helpers ---------- */
const isHttp = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

const normalizeDriveLink = (url) => {
  if (!url) return null;
  const m =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = m ? m[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w800&id=${id}`
    : url;
};

// Resolve: Drive -> http(s) -> null(placeholder)
const resolveImage = (img) => {
  if (!img) return null;
  if (/drive\.google\.com/.test(img)) return normalizeDriveLink(img);
  if (isHttp(img)) return img;
  return null; // filenames locales: usa placeholder por ahora
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
  variants
    .flatMap((v) => (v.tallas || v.sizes || []).map((s) => s?.size))
    .filter(Boolean);

const colorsOf = (variants = []) =>
  variants.map((v) => v?.color).filter(Boolean);

/* ---------- Product Card (con imagen) ---------- */
const ProductCard = ({ product }) => {
  const displaySrc =
    resolveImage((product.images || [])[0]) ||
    "https://placehold.co/600x800?text=Sin+Imagen";

  const sizes = sizesOf(product.variants);
  const colors = colorsOf(product.variants);

  return (
    <div className="col s12 m6 l4 xl3">
      <div className="card product-card-airbnb">
        <Link
          to={`/products/${product.catSlug || "sin_categoria"}/${product.id}`}
          className="product-card-link"
        >
          <div className="card-image product-card-image-wrapper">
            <img
              src={displaySrc}
              alt={product.name || "Sin nombre"}
              className="product-image"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/600x800?text=Sin+Imagen";
              }}
            />
          </div>
          <div className="card-content product-card-content">
            <h6 className="product-name">{product.name || "Sin nombre"}</h6>
            <p className="product-price">
  {Number(product?.price_cop) > 0 ? (
    <>
      {(() => {
        const price = Number(product.price_cop) || 0;
        const old   = Number(product.price_old) || 0;
        const pct   =
          product?.discount != null
            ? Number(product.discount)
            : old > price
              ? Math.round((1 - price / old) * 100)
              : null;

        return (
          <>
            <span className="price-pill">
              <span className="currency">$</span>
              <span className="amount">{price.toLocaleString("es-CO")}</span>
              {pct > 0 && <span className="save">AHORRA {pct}%</span>}
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

/* ---------- Main ---------- */
export default function ProductList() {
  const { products, loading, error } = useContext(ProductsContext);

  const enriched = useMemo(
    () => products.map((p) => ({ ...p, depSlug: depToSlug(p) })),
    [products]
  );

  // chips de departamento desde BD
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

  // subcategorías por categoría dentro del depto activo
  const subcatGroups = useMemo(() => {
    const base = enriched.filter((p) => !dep || p.depSlug === dep);
    const map = new Map(); // category -> Set(subcat)
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
            title={`Filtrar por ${label}`}
          >
            {label} <span className="count">({count})</span>
          </button>
        ))}
      </div>

      {/* Subcategorías (texto) */}
      {subcatGroups.length > 0 && (
        <>
          <h5 className="subcat-heading">
            Explora por subcategoría{" "}
            {dep
              ? `— ${
                  departmentChips.find((d) => d.key === dep)?.label || ""
                }`
              : ""}
          </h5>
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
                          onClick={() =>
                            setSubFilter(subFilter === s ? "" : s)
                          }
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

      {/* Grilla de productos (con imagen) */}
      <div className="row">
        {filtered.length ? (
          filtered.map((p) => (
            <ProductCard key={`${p.catSlug}-${p.id}`} product={p} />
          ))
        ) : (
          <p className="center-align">No se encontraron productos</p>
        )}
      </div>
    </div>
  );
}
