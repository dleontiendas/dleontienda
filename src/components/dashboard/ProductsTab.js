// src/admin/ProductsTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "../../Firebase";
import "./ProductsTab.css";

/* ---------- Helpers ---------- */
const toCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const fromCsv = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const currencyCO = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("es-CO")}`
    : `$${Number(n || 0).toLocaleString("es-CO")}`;
const emptyProduct = (over = {}) => ({
  sku: "",
  name: "",
  brand: "",
  department: "",
  category: "",
  subcategory: "",
  description: "",
  price_cop: 0,
  images: [],
  active: true,
  variants: [], // [{color, tallas:[{size, stock}]}]
  ...over,
});

/* ---------- Modal ---------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="ap-modal-backdrop" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-header">
          <h3>{title}</h3>
          <button className="ap-icon-btn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>
        <div className="ap-modal-body">{children}</div>
        {footer && <div className="ap-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Variants Editor ---------- */
function VariantsEditor({ value = [], onChange }) {
  const setAll = (v) => onChange(Array.isArray(v) ? v : []);
  const addColor = () =>
    setAll([...value, { color: "", tallas: [{ size: "", stock: 0 }] }]);
  const removeColor = (i) => setAll(value.filter((_, idx) => idx !== i));
  const setColor = (i, color) => {
    const next = [...value];
    next[i] = { ...next[i], color };
    setAll(next);
  };
  const addSize = (i) => {
    const next = [...value];
    const tallas = Array.isArray(next[i].tallas) ? next[i].tallas : [];
    next[i] = { ...next[i], tallas: [...tallas, { size: "", stock: 0 }] };
    setAll(next);
  };
  const setSizeRow = (i, j, field, v) => {
    const next = [...value];
    const tallas = Array.isArray(next[i].tallas) ? [...next[i].tallas] : [];
    const row = { ...(tallas[j] || { size: "", stock: 0 }), [field]: v };
    // sanitiza
    if (field === "stock") row.stock = Math.max(0, Number(v || 0));
    tallas[j] = row;
    next[i] = { ...next[i], tallas };
    setAll(next);
  };
  const removeSizeRow = (i, j) => {
    const next = [...value];
    const tallas = (next[i].tallas || []).filter((_, idx) => idx !== j);
    next[i] = { ...next[i], tallas: tallas.length ? tallas : [{ size: "", stock: 0 }] };
    setAll(next);
  };

  return (
    <div className="var-wrap">
      <div className="var-head">
        <h4>Variantes (Color / Tallas y stock)</h4>
        <button type="button" className="ap-btn ap-btn--primary" onClick={addColor}>
          + Color
        </button>
      </div>

      {!value.length ? (
        <div className="ap-empty">Sin variantes. Agrega un color.</div>
      ) : (
        value.map((v, i) => (
          <div className="var-card" key={`color-${i}`}>
            <div className="var-row">
              <label className="var-color">
                Color
                <input
                  value={v.color || ""}
                  onChange={(e) => setColor(i, e.target.value)}
                  placeholder="Negro, Azul, Rojo…"
                />
              </label>

              <button
                type="button"
                className="ap-btn ap-btn--danger var-remove"
                onClick={() => removeColor(i)}
                title="Eliminar color"
              >
                Eliminar color
              </button>
            </div>

            <div className="size-table">
              <div className="size-head">
                <div>Talla</div>
                <div>Stock</div>
                <div>Acción</div>
              </div>
              <div className="size-body">
                {(v.tallas || [{ size: "", stock: 0 }]).map((s, j) => (
                  <div className="size-row" key={`size-${i}-${j}`}>
                    <input
                      className="size-input"
                      placeholder="S / 30 / Única…"
                      value={s.size || ""}
                      onChange={(e) => setSizeRow(i, j, "size", e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="stock-input"
                      value={Number(s.stock || 0)}
                      onChange={(e) => setSizeRow(i, j, "stock", e.target.value)}
                    />
                    <button
                      type="button"
                      className="ap-btn ap-btn--ghost"
                      onClick={() => removeSizeRow(i, j)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="var-actions">
              <button type="button" className="ap-btn" onClick={() => addSize(i)}>
                + Añadir talla
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- Editor principal ---------- */
function ProductForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <>
      <div className="ap-form-grid">
        <label>
          SKU
          <input
            value={value.sku || ""}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="JNS210"
          />
        </label>
        <label className="span-2">
          Nombre
          <input
            value={value.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jean slim fit hombre"
            required
          />
        </label>
        <label>
          Marca
          <input
            value={value.brand || ""}
            onChange={(e) => set("brand", e.target.value)}
          />
        </label>
        <label>
          Departamento
          <input
            value={value.department || ""}
            onChange={(e) => set("department", e.target.value)}
            placeholder="Hombre / Mujer / Infantil…"
          />
        </label>
        <label>
          Categoría
          <input
            value={value.category || ""}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Ropa / Calzado…"
          />
        </label>
        <label>
          Subcategoría
          <input
            value={value.subcategory || ""}
            onChange={(e) => set("subcategory", e.target.value)}
            placeholder="Jeans, Camisetas…"
          />
        </label>
        <label>
          Precio (COP)
          <input
            type="number"
            min="0"
            step="1"
            value={value.price_cop ?? 0}
            onChange={(e) => set("price_cop", Number(e.target.value))}
          />
        </label>
        <label className="span-2">
          Imágenes (CSV)
          <input
            value={toCsv(value.images)}
            onChange={(e) => set("images", fromCsv(e.target.value))}
            placeholder="https://..., https://..."
          />
        </label>
        <label className="span-2">
          Descripción
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={!!value.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Activo
        </label>
      </div>

      {/* Variantes */}
      <VariantsEditor value={value.variants || []} onChange={(v) => set("variants", v)} />
    </>
  );
}

/* ---------- Main ---------- */
export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyProduct());
  const [creating, setCreating] = useState(false);
  const [catForCreate, setCatForCreate] = useState("ropa");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collectionGroup(db, "items"));
        const items = snap.docs.map((d) => ({
          id: d.id,
          ref: d.ref,
          catSlug: d.ref.parent?.parent?.id || "sin_categoria",
          ...d.data(),
        }));
        items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setRows(items);
      } catch (e) {
        console.error("❌ Error listando productos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((p) => {
      const txt = [p.name, p.sku, p.brand, p.department, p.category, p.subcategory]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return txt.includes(needle);
    });
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onOpenEdit = (row) => {
    setEditing(row);
    setDraft(
      emptyProduct({
        ...row,
        images: Array.isArray(row.images) ? row.images : fromCsv(row.images),
        variants: Array.isArray(row.variants) ? row.variants : [],
      })
    );
  };
  const onCloseModal = () => {
    setEditing(null);
    setCreating(false);
    setDraft(emptyProduct());
  };

  const onSave = async () => {
    try {
      // sanea variantes: elimina filas vacías o con talla vacía
      const variantsClean = (draft.variants || [])
        .map((v) => ({
          color: String(v.color || "").trim(),
          tallas: (v.tallas || [])
            .map((t) => ({
              size: String(t.size || "").trim(),
              stock: Math.max(0, Number(t.stock || 0)),
            }))
            .filter((t) => t.size),
        }))
        .filter((v) => v.color && v.tallas.length);

      const payload = {
        sku: draft.sku || editing?.sku || "",
        name: draft.name || "",
        brand: draft.brand || "",
        department: draft.department || "",
        category: draft.category || "",
        subcategory: draft.subcategory || "",
        description: draft.description || "",
        price_cop: Number(draft.price_cop || 0),
        images: draft.images || [],
        active: !!draft.active,
        variants: variantsClean,
        updated_at: new Date(),
      };

      if (creating) {
        const refCol = collection(db, "productos", catForCreate, "items");
        const added = await addDoc(refCol, { ...payload, created_at: new Date() });
        setRows((prev) => [
          ...prev,
          { id: added.id, ref: added, catSlug: catForCreate, ...payload },
        ]);
      } else if (editing?.ref) {
        await updateDoc(editing.ref, payload);
        setRows((prev) =>
          prev.map((r) => (r.id === editing.id ? { ...editing, ...payload } : r))
        );
      }
      onCloseModal();
    } catch (e) {
      console.error("❌ Error guardando producto:", e);
      alert("No se pudo guardar. Revisa la consola.");
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Eliminar "${row.name}"?`)) return;
    try {
      await deleteDoc(row.ref);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      console.error("❌ Error eliminando:", e);
      alert("No se pudo eliminar.");
    }
  };

  return (
    <div className="ap-wrap">
      <header className="ap-header">
        <h2>Productos</h2>
        <div className="ap-controls">
          <input
            className="ap-search"
            placeholder="Buscar por nombre, SKU, marca, categoría…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <button
            className="ap-btn ap-btn--primary"
            onClick={() => {
              setCreating(true);
              setDraft(emptyProduct());
            }}
          >
            + Nuevo
          </button>
        </div>
      </header>

      {loading ? (
        <div className="ap-empty">Cargando…</div>
      ) : !rows.length ? (
        <div className="ap-empty">No hay productos.</div>
      ) : (
        <>
          <div className="ap-table">
            <div className="ap-thead">
              <div>Producto</div>
              <div>SKU</div>
              <div>Categoría</div>
              <div>Precio</div>
              <div>Activo</div>
              <div>Acciones</div>
            </div>
            <div className="ap-tbody">
              {pageRows.map((r) => (
                <div className="ap-row" key={`${r.catSlug}-${r.id}`}>
                  <div className="ap-cell">
                    <div className="ap-name">{r.name || "—"}</div>
                    <div className="ap-sub">
                      {r.brand || "—"} · {r.department || "—"} · {r.category || "—"}
                      {r.subcategory ? ` / ${r.subcategory}` : ""}
                    </div>
                  </div>
                  <div className="ap-cell mono">{r.sku || "—"}</div>
                  <div className="ap-cell">{r.catSlug || r.category || "—"}</div>
                  <div className="ap-cell">{currencyCO(r.price_cop)}</div>
                  <div className="ap-cell">
                    <span className={`ap-badge ${r.active ? "ok" : "off"}`}>
                      {r.active ? "Sí" : "No"}
                    </span>
                  </div>
                  <div className="ap-cell actions">
                    <button className="ap-btn ap-btn--ghost" onClick={() => onOpenEdit(r)}>
                      Editar
                    </button>
                    <button className="ap-btn ap-btn--danger" onClick={() => onDelete(r)}>
                      Eliminar
                    </button>
                    <a
                      className="ap-btn ap-btn--link"
                      href={`/products/${r.catSlug}/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ap-pager">
            <button
              className="ap-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              className="ap-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      <Modal
        open={!!editing || creating}
        title={creating ? "Nuevo producto" : "Editar producto"}
        onClose={onCloseModal}
        footer={
          <>
            <button className="ap-btn" onClick={onCloseModal}>Cancelar</button>
            {creating && (
              <div className="ap-cat-select">
                <span>Guardar en:</span>
                <select
                  value={catForCreate}
                  onChange={(e) => setCatForCreate(e.target.value)}
                  title="ID doc categoría (slug)"
                >
                  <option value="ropa">ropa</option>
                  <option value="calzado">calzado</option>
                  <option value="accesorios">accesorios</option>
                  <option value="sin_categoria">sin_categoria</option>
                </select>
              </div>
            )}
            <button className="ap-btn ap-btn--primary" onClick={onSave}>Guardar</button>
          </>
        }
      >
        <ProductForm value={draft} onChange={setDraft} />
      </Modal>
    </div>
  );
}
