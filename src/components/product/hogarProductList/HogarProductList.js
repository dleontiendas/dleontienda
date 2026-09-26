import { useCategoryHistoryState } from "../categoryHistory";
import React, { useContext, useMemo } from "react";
import { ProductsContext } from "../../../context/ProductContext";
import { ProductCard } from "../modaProductList/modaProductList";
import "../ProductList.css";

const normalize = (value = "") =>
  String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const HOME_GROUPS = [
  { key: "dormitorio", label: "Dormitorio", image: "/images/home/dormitorio.jpg" },
  { key: "bano", label: "Baño", image: "/images/home/bano.jpg" },
  { key: "cortinas", label: "Cortinas", image: "/images/home/cortinas.jpg" },
  { key: "descanso", label: "Descanso", image: "/images/home/descanso.jpg" },
  { key: "decoracion", label: "Decoración", image: "/images/home/decoracion.jpg" },
];

const getGroup = (product) => {
  const department = normalize(product?.department);
  const subcategory = normalize(product?.subcategory);
  if (department.includes("dormitorio") || /almohad|sabana/.test(subcategory)) return "dormitorio";
  if (department.includes("bano") || /toalla|cortina.*bano/.test(subcategory)) return "bano";
  if (department.includes("cortina") || /cortina.*sala/.test(subcategory)) return "cortinas";
  if (department.includes("descanso") || /hamaca/.test(subcategory)) return "descanso";
  if (department.includes("decor") || /cojin|tapete/.test(subcategory)) return "decoracion";
  return "decoracion";
};

const getPrice = (product) => {
  const value = Number(product?.price_cop);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export default function HogarProductList() {
  const { products, loading, error } = useContext(ProductsContext);
  const [group, setGroup] = useCategoryHistoryState("group", "");
  const [subcategory, setSubcategory] = useCategoryHistoryState("subcategory", "");
  const [openGroup, setOpenGroup] = useCategoryHistoryState("openGroup", null);
  const [sort, setSort] = useCategoryHistoryState("sort", "");

  const homeProducts = useMemo(() => (products || []).filter((product) => {
    const category = normalize(`${product?.category || ""} ${product?.catSlug || ""}`);
    return category.includes("hogar") || category.includes("home");
  }).map((product) => ({ ...product, homeGroup: getGroup(product) })), [products]);

  const counts = useMemo(() => homeProducts.reduce((result, product) => {
    result[product.homeGroup] = (result[product.homeGroup] || 0) + 1;
    return result;
  }, {}), [homeProducts]);

  const subcategoriesByGroup = useMemo(() => {
    const result = HOME_GROUPS.reduce((groups, item) => ({ ...groups, [item.key]: new Set() }), {});
    homeProducts.forEach((product) => {
      const name = String(product?.subcategory || "").trim();
      if (name) result[product.homeGroup]?.add(name);
    });
    return Object.fromEntries(
      Object.entries(result).map(([key, names]) => [key, Array.from(names).sort((a, b) => a.localeCompare(b, "es"))]),
    );
  }, [homeProducts]);

  const filtered = useMemo(() => homeProducts.filter((product) => {
    const matchesGroup = !group || product.homeGroup === group;
    const matchesSubcategory = !subcategory || normalize(product.subcategory) === normalize(subcategory);
    return matchesGroup && matchesSubcategory;
  }), [homeProducts, group, subcategory]);

  const sorted = useMemo(() => {
    const result = [...filtered];
    if (sort === "price_asc") result.sort((a, b) => (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity));
    if (sort === "price_desc") result.sort((a, b) => (getPrice(b) ?? -Infinity) - (getPrice(a) ?? -Infinity));
    return result;
  }, [filtered, sort]);

  const visibleGroups = group ? HOME_GROUPS.filter((item) => item.key === group) : HOME_GROUPS;

  if (loading) return <p className="center-align">Cargando productos...</p>;
  if (error) return <p className="center-align red-text">Error: {error}</p>;

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">Hogar</h4>
      <div className="gender-filters" aria-label="Secciones de Hogar">
        <button className={`gender-chip ${!group ? "gender-chip--active" : ""}`} onClick={() => { setGroup(""); setSubcategory(""); }}>
          Todos <span className="count">({homeProducts.length})</span>
        </button>
        {HOME_GROUPS.map((item) => (
          <button key={item.key} className={`gender-chip gender-chip--image ${group === item.key ? "gender-chip--active" : ""}`} onClick={() => { setGroup(item.key); setSubcategory(""); }}>
            <img src={item.image} alt={item.label} loading="lazy" />
            <span className="gender-chip-label">{item.label} <span className="count">({counts[item.key] || 0})</span></span>
          </button>
        ))}
      </div>

      <div className="controls-row row" style={{ alignItems: "center" }}>
        <div className="col s12 m8"><h5 className="subcat-heading">Explora por subcategoría{group ? ` — ${HOME_GROUPS.find((item) => item.key === group)?.label}` : ""}</h5></div>
        <div className="col s12 m4 right-align">
          <label htmlFor="home-sort" className="sort-label">Ordenar:</label>
          <select id="home-sort" className="browser-default sort-select" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="">Relevancia</option><option value="price_asc">Precio: menor a mayor</option><option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      <div className="row subcat-grid">
        {visibleGroups.map((item) => {
          const isOpen = openGroup === item.key;
          return <div className="col s12 m6 l4 xl3" key={item.key}><div className={`subcat-card text-only card-border accordion-item ${isOpen ? "open" : ""}`}>
            <button type="button" className="accordion-header" onClick={() => setOpenGroup(isOpen ? null : item.key)} aria-expanded={isOpen}>
              <h6 className="subcat-title">{item.label}</h6><span className="accordion-arrow">⌄</span>
            </button>
            <div className="subcat-chips">
              {(subcategoriesByGroup[item.key] || []).length ? (subcategoriesByGroup[item.key] || []).map((name) => <button key={name} type="button" className={`subcat-chip ${subcategory === name ? "active" : ""}`} onClick={() => setSubcategory(subcategory === name ? "" : name)} aria-pressed={subcategory === name}>{name}</button>) : <span className="subcat-empty">Las subcategorías aparecerán al cargar productos.</span>}
            </div>
          </div></div>;
        })}
      </div>

      <div className="product-grid">
        {sorted.length ? sorted.map((product) => <ProductCard key={`${product.catSlug || "hogar"}-${product.id}`} product={product} />) : <p className="center-align home-empty-state">Aún no hay productos en esta selección.</p>}
      </div>
    </div>
  );
}
