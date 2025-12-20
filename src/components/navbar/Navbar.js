// src/components/Navbar/Navbar.jsx
import React, { useState, useContext, useMemo, useEffect, useRef, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { ProductsContext } from "../../context/ProductContext";
import { ShoppingCart, Search, X } from "lucide-react";
import "materialize-css/dist/css/materialize.min.css";
import "./Navbar.css";

const PLACEHOLDER = "https://placehold.co/80x80?text=No+img";

// why: normaliza para búsqueda tolerante a acentos y mayúsculas
const normalize = (s = "") =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const firstImage = (p) => {
  if (Array.isArray(p?.images) && p.images[0]) return p.images[0];
  const v = Array.isArray(p?.variants) ? p.variants.find((x) => Array.isArray(x?.images) && x.images[0]) : null;
  return v?.images?.[0] || PLACEHOLDER;
};

const currencyCO = (n) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString("es-CO")}` : "");

const Navbar = ({ onSearch }) => {
  const { cart } = useContext(Ccart);
  const { products } = useContext(ProductsContext);
  const navigate = useNavigate();

  // ---- carrito
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ---- búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);

  const listboxId = useId();
  const optionId = (i) => `${listboxId}-opt-${i}`;

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      if (onSearch) onSearch(searchTerm.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, onSearch]);

  // cerrar al hacer click afuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(debouncedTerm);
    if (!q) return [];
    const byScore = products
      .map((p) => {
        const name = p?.name || "";
        const sku = p?.sku || p?.id || "";
        const nName = normalize(name);
        const nSku = normalize(String(sku));
        let score = -1;
        if (nName.startsWith(q)) score = 0; // why: prioriza prefijos
        else if (nName.includes(q)) score = 1;
        else if (nSku.includes(q)) score = 2;
        return score >= 0 ? { p, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || (a.p.name || "").localeCompare(b.p.name || ""))
      .slice(0, 8)
      .map((x) => x.p);
    return byScore;
  }, [debouncedTerm, products]);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    setOpen(true);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && filtered[highlightIndex]) {
        const prod = filtered[highlightIndex];
        navigate(`/products/${prod.catSlug || "sin_categoria"}/${prod.id}`);
        setOpen(false);
        setHighlightIndex(-1);
      } else if (debouncedTerm) {
        // why: fallback, navega a página general si la tuvieras
        navigate(`/?q=${encodeURIComponent(debouncedTerm)}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setDebouncedTerm("");
    setOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
    if (onSearch) onSearch("");
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const idx = normalize(text).indexOf(normalize(q));
    if (idx < 0) return text;
    const end = idx + q.length;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, end)}</mark>
        {text.slice(end)}
      </>
    );
  };

  return (
    <header>
      {/*  Barra superior  */}
      <div className="navbar-top grey lighten-2 z-depth-1">
        <div className="container navbar-top-content">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <img
                src="/logodleon.png"
                alt="D'Leon Gold"
                className="brand-logo-img"
                style={{ height: "115px" }}
              />
            </Link>
          </div>

          {/*  Buscador  */}
          <div
            className={`navbar-search ${open ? "is-open" : ""}`}
            ref={wrapperRef}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-owns={listboxId}
          >
            <Search size={18} className="navbar-search-icon-left" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              placeholder="Buscar productos…"
              value={searchTerm}
              onChange={handleChange}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="browser-default navbar-input"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={highlightIndex >= 0 ? optionId(highlightIndex) : undefined}
            />
            {searchTerm && (
              <button
                type="button"
                className="navbar-clear-btn"
                onClick={handleClear}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              className="navbar-search-btn"
              onClick={() => {
                if (debouncedTerm) navigate(`/?q=${encodeURIComponent(debouncedTerm)}`);
              }}
              aria-label="Buscar"
            >
              <Search size={18} />
            </button>

            {/* Dropdown resultados */}
            {open && (
              <div className="navbar-autocomplete" role="listbox" id={listboxId} ref={listRef}>
                {debouncedTerm && filtered.length === 0 && (
                  <div className="ac-empty">No hay resultados para “{debouncedTerm}”.</div>
                )}

                {filtered.map((p, i) => {
                  const active = i === highlightIndex;
                  return (
                    <Link
                      key={`${p.catSlug}-${p.id}`}
                      to={`/products/${p.catSlug || "sin_categoria"}/${p.id}`}
                      role="option"
                      aria-selected={active}
                      id={optionId(i)}
                      className={`ac-item ${active ? "active" : ""}`}
                      onMouseEnter={() => setHighlightIndex(i)}
                      onClick={() => {
                        setOpen(false);
                        setHighlightIndex(-1);
                      }}
                    >
                      <img src={firstImage(p)} alt="" className="ac-thumb" />
                      <div className="ac-info">
                        <div className="ac-name">
                          {highlight(p.name || "Sin nombre", debouncedTerm)}
                        </div>
                        <div className="ac-meta">
                          {p.subcategory || p.category || "—"} ·{" "}
                          <span className="ac-price">
                            {currencyCO(Number(p.price_cop))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/*  Acciones */}
          <div className="navbar-right">
            <Link to="/cart" className="nav-icon tooltipped" data-tooltip="Carrito">
              <ShoppingCart size={24} color="#000" />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              <span>Carrito</span>
            </Link>
          </div>
        </div>
      </div>

      {/*  Subbarra gris con categorías */}
      <div className="navbar-bottom grey lighten-3 z-depth-1">
        <div className="container navbar-bottom-content flex gap-4">
          <Link to="/" className="nav-link active">Inicio</Link>
          <Link to="/moda" className="nav-link">Moda</Link>
          <Link to="/tecnologia" className="nav-link">Tecnología</Link>
          <Link to="/ofertas" className="nav-link">Ofertas</Link>
        </div>
      </div>
    </header>
  );
};

// Corrige referencia al contexto de carrito
function CcartProviderGuard() { return null; } // placeholder para tree-shaking
const Ccart = CartContext;

export default Navbar;
