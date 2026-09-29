import { useCategoryHistoryState } from "../categoryHistory";
import React, { useContext, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductsContext } from "../../../context/ProductContext";
import { resolveProductCardPricing } from "../../utils/productPricing";
import { ProductCard } from "../modaProductList/modaProductList";
import "../ProductList.css";
import {
  buildCategorySearchParams,
  categoryFromSubcategory,
  matchesCategoryFilters,
  readCategoryFilters,
  toCategoryFilterSlug,
} from "../categoryUrlFilters";
import {
  buildTechnologyDepartments,
  buildTechnologySubcategoryGroups,
  isTechnologyProduct,
  normalizeTechnologyDepartment,
} from "./technologyDepartment";

const productPrice = (product) => resolveProductCardPricing(product).price;

export default function TechProductList() {
  const { products, loading, error } = useContext(ProductsContext);

  const technologyProducts = useMemo(() => (products || [])
    .filter(isTechnologyProduct)
    .map((product) => ({
      ...product,
      depSlug: normalizeTechnologyDepartment(product.department),
    })), [products]);

  const departments = useMemo(
    () => buildTechnologyDepartments(technologyProducts),
    [technologyProducts],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const { department, category, subcategory } = useMemo(
    () => readCategoryFilters(new URLSearchParams(searchKey), departments.map(({ key }) => key)),
    [searchKey, departments],
  );
  const [openDepartment, setOpenDepartment] = useCategoryHistoryState("openGroup", department || null);
  const [sort, setSort] = useCategoryHistoryState("sort", "");

  useEffect(() => {
    if (department) setOpenDepartment(department);
  }, [department, setOpenDepartment]);

  const updateFilters = (next) => setSearchParams(buildCategorySearchParams(next));

  const subcategoryGroups = useMemo(
    () => buildTechnologySubcategoryGroups(technologyProducts, departments),
    [technologyProducts, departments],
  );

  const visibleGroups = department
    ? subcategoryGroups.filter(({ key }) => key === department)
    : subcategoryGroups;

  const filtered = useMemo(() => technologyProducts.filter((product) =>
    matchesCategoryFilters(product, { department, category, subcategory })),
  [technologyProducts, department, category, subcategory]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const first = productPrice(a);
      const second = productPrice(b);
      if (first === null && second === null) return String(a.name || "").localeCompare(String(b.name || ""), "es");
      if (first === null) return 1;
      if (second === null) return -1;
      return sort === "price_asc" ? first - second : second - first;
    });
  }, [filtered, sort]);

  if (loading) return <p className="center-align">Cargando productos...</p>;
  if (error) return <p className="center-align red-text">Error: {error}</p>;

  return (
    <div className="container product-list-container">
      <h4 className="left-align product-list-title">Tecnología</h4>

      <div className="gender-filters" aria-label="Departamentos de Tecnología">
        <button
          className={`gender-chip ${!department ? "gender-chip--active" : ""}`}
          onClick={() => { updateFilters({}); setOpenDepartment(null); }}
        >
          Todos <span className="count">({technologyProducts.length})</span>
        </button>

        {departments.map((item) => (
          <button
            key={item.key}
            className={`gender-chip gender-chip--image ${department === item.key ? "gender-chip--active" : ""}`}
            onClick={() => { updateFilters({ department: item.key }); setOpenDepartment(item.key); }}
          >
            <img src={item.image} alt={item.label} loading="lazy" />
            <span className="gender-chip-label">
              {item.label} <span className="count">({item.count})</span>
            </span>
          </button>
        ))}
      </div>

      <div className="controls-row row" style={{ alignItems: "center" }}>
        <div className="col s12 m8">
          <h5 className="subcat-heading">
            Explora por subcategoría
            {department ? ` — ${departments.find(({ key }) => key === department)?.label || ""}` : ""}
          </h5>
        </div>
        <div className="col s12 m4 right-align">
          <label htmlFor="technology-sort" className="sort-label">Ordenar:</label>
          <select
            id="technology-sort"
            className="browser-default sort-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Ordenar productos de Tecnología por precio"
          >
            <option value="">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      <div className="row subcat-grid">
        {visibleGroups.map((group) => {
          const isOpen = openDepartment === group.key;
          return (
            <div className="col s12 m6 l4 xl3" key={group.key}>
              <div className={`subcat-card text-only card-border accordion-item ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => setOpenDepartment(isOpen ? null : group.key)}
                  aria-expanded={isOpen}
                >
                  <h6 className="subcat-title">{group.label}</h6>
                  <span className="accordion-arrow">⌄</span>
                </button>
                <div className="subcat-chips">
                  {group.subcats.length ? group.subcats.map((name) => {
                    const subcategorySlug = toCategoryFilterSlug(name);
                    const categorySlug = categoryFromSubcategory(name);
                    const active = subcategory
                      ? subcategory === subcategorySlug
                      : category === categorySlug && subcategorySlug === categorySlug;
                    return (
                      <button
                        key={subcategorySlug}
                        type="button"
                        className={`subcat-chip ${active ? "active" : ""}`}
                        onClick={() => updateFilters(active
                          ? { department }
                          : { department: department || group.key, category: categorySlug, subcategory: subcategorySlug })}
                        aria-pressed={active}
                      >
                        {name}
                      </button>
                    );
                  }) : <span className="subcat-empty">Las subcategorías aparecerán al cargar productos.</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="product-grid">
        {sorted.length
          ? sorted.map((product) => <ProductCard key={`${product.catSlug || "tecnologia"}-${product.id}`} product={product} />)
          : <p className="center-align">No se encontraron productos de Tecnología</p>}
      </div>
    </div>
  );
}
