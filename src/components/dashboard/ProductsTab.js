// ========================= src/admin/ProductsTab.jsx =========================
import React, { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc, // (aún importado por compat, ya no lo usamos para crear)
  collection,
  writeBatch,
  setDoc,
  doc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "../../Firebase";
import "./ProductsTab.css";

/* ---------- Helpers ---------- */
const toCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const fromCsv = (s) =>
  String(s || "")
    .split(/[\n,]+/) // coma o salto de línea
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
  weight_grams: 0,
  warranty: "",
  care_instructions: "",
  materials: "",
  ...over,
});

/* ---------- Normalizadores ---------- */
const toStr = (v) => (v === undefined || v === null ? "" : String(v).trim());
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const sanitizeId = (s) =>
  toStr(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 120);
const normalizeDriveLink = (url) => {
  const u = toStr(url);
  if (!u) return null;
  const m =
    u.match(/\/d\/([a-zA-Z0-9-_]+)/) || u.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = m ? m[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w1200&id=${id}`
    : u;
};

/* ---------- Modal (no cierra por clic fuera) ---------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="ap-modal-backdrop"
      onClick={() => {
        // Intencionalmente NO cerramos al clicar fuera
      }}
    >
      <div
        className="ap-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
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
    if (field === "stock") row.stock = Math.max(0, Number(v || 0)); // por sanidad
    tallas[j] = row;
    next[i] = { ...next[i], tallas };
    setAll(next);
  };
  const removeSizeRow = (i, j) => {
    const next = [...value];
    const tallas = (next[i].tallas || []).filter((_, idx) => idx !== j);
    next[i] = {
      ...next[i],
      tallas: tallas.length ? tallas : [{ size: "", stock: 0 }],
    };
    setAll(next);
  };

  return (
    <div className="var-wrap">
      <div className="var-head">
        <h4>Variantes (Color / Tallas y stock)</h4>
        <button
          type="button"
          className="ap-btn ap-btn--primary"
          onClick={addColor}
        >
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
                      onChange={(e) =>
                        setSizeRow(i, j, "stock", e.target.value)
                      }
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
              <button
                type="button"
                className="ap-btn"
                onClick={() => addSize(i)}
              >
                + Añadir talla
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- Editor principal (sin backdrop interno) ---------- */
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
            required
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

        {/* NUEVOS CAMPOS */}
        <label>
          Peso (Gr)
          <input
            type="number"
            min="0"
            step="1"
            value={value.weight_grams ?? 0}
            onChange={(e) => set("weight_grams", Number(e.target.value))}
            placeholder="0"
          />
        </label>
        <label>
          Garantía
          <input
            value={value.warranty || ""}
            onChange={(e) => set("warranty", e.target.value)}
            placeholder="30 días por defectos de fábrica"
          />
        </label>
        <label className="span-2">
          Cuidados y lavado
          <input
            value={value.care_instructions || ""}
            onChange={(e) => set("care_instructions", e.target.value)}
            placeholder="Lavar a mano, no usar cloro…"
          />
        </label>

        <label className="span-2">
          Materiales y composición
          <input
            value={value.materials || ""}
            onChange={(e) => set("materials", e.target.value)}
            placeholder="Algodón, poliéster…"
          />
        </label>

        <label className="span-2">
          Imágenes (CSV o una por línea)
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              rows={3}
              style={{ flex: 1 }}
              value={toCsv(value.images)} // sigue mostrando como CSV
              onChange={(e) => set("images", fromCsv(e.target.value))}
              placeholder={`https://...,\nhttps://...\n(o una por línea)`}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="ap-btn"
                onClick={() => {
                  const url = window.prompt("Pega la URL de la imagen:");
                  if (!url) return;
                  const trimmed = String(url).trim();
                  if (!trimmed) return;
                  const next = Array.isArray(value.images)
                    ? [...value.images, trimmed]
                    : [trimmed];
                  set("images", next);
                }}
                title="Añadir una URL sin escribir el CSV"
              >
                + Añadir imagen
              </button>
              <small style={{ opacity: 0.8, textAlign: "center" }}>
                {Array.isArray(value.images) ? value.images.length : 0} img
              </small>
            </div>
          </div>
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
      <VariantsEditor
        value={value.variants || []}
        onChange={(v) => set("variants", v)}
      />
    </>
  );
}

/* ---------- Modal: Carga por lotes ---------- */
function BatchUploadModal({ open, onClose, onMergeRows }) {
  const [parsed, setParsed] = useState([]);
  const [rawCount, setRawCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const appendLog = (m) => setLog((prev) => [...prev, m]);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setParsed([]);
    setLog([]);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" });
      setRawCount(rows.length);

      const acc = new Map();
      for (const r of rows) {
        const sku = toStr(r["COD Ref SKU"]);
        if (!sku) {
          appendLog("Fila sin SKU, se omite.");
          continue;
        }
        const nombre = toStr(r["Nombre"]);
        const marca = toStr(r["Marca"]);
        const categoria = toStr(r["Categoría"]);
        const subcat = toStr(r["Sub-Categoría"]);
        const depto = toStr(r["Departamento"]);
        const desc = toStr(r["Descripción"]);
        const materiales = toStr(r["Materiales y composición"]);
        const cuidados = toStr(r["Cuidados y lavado"]);
        const garantia = toStr(r["Garantía"]);
        const precio = toNum(r["Precio (COL)"]);
        const peso = toNum(r["Peso (Gr)"]);

        const imgPrincipal = normalizeDriveLink(r["Imagen Principal"]);
        const img1 = normalizeDriveLink(r["Imagen1"]);
        const img2 = normalizeDriveLink(r["Imagen2"]);

        const color = toStr(r["Color"]);
        const talla = toStr(r["Talla"]);
        const cantidad = toNum(r["Cantidad"]);

        if (!acc.has(sku)) {
          acc.set(sku, {
            base: {
              sku,
              name: nombre,
              brand: marca,
              category: categoria,
              subcategory: subcat,
              department: depto,
              description: desc,
              materials: materiales,
              care_instructions: cuidados,
              warranty: garantia,
              price_cop: precio,
              weight_grams: peso,
            },
            variantes: [],
            imgs: [],
          });
        }
        const entry = acc.get(sku);
        if (nombre && !entry.base.name) entry.base.name = nombre;
        if (marca && !entry.base.brand) entry.base.brand = marca;
        if (categoria && !entry.base.category) entry.base.category = categoria;
        if (subcat && !entry.base.subcategory) entry.base.subcategory = subcat;
        if (depto && !entry.base.department) entry.base.department = depto;
        if (desc && !entry.base.description) entry.base.description = desc;
        if (materiales && !entry.base.materials) entry.base.materials = materiales;
        if (cuidados && !entry.base.care_instructions) entry.base.care_instructions = cuidados;
        if (garantia && !entry.base.warranty) entry.base.warranty = garantia;
        if (precio && !entry.base.price_cop) entry.base.price_cop = precio;
        if (peso && !entry.base.weight_grams) entry.base.weight_grams = peso;

        [imgPrincipal, img1, img2].forEach((u) => {
          if (u && !entry.imgs.includes(u)) entry.imgs.push(u);
        });

        if (color || talla || Number.isFinite(cantidad)) {
          entry.variantes.push({
            color,
            talla,
            cantidad: Math.max(0, Math.trunc(cantidad || 0)),
          });
        }
      }

      const productos = [];
      for (const { base, variantes, imgs } of acc.values()) {
        const porColor = {};
        for (const v of variantes) {
          const key = v.color || "sin_color";
          if (!porColor[key]) porColor[key] = { color: key, tallas: [] };
          if (v.talla)
            porColor[key].tallas.push({
              size: v.talla,
              stock: v.cantidad || 0,
            });
        }

        const producto = {
          sku: toStr(base.sku),
          name: toStr(base.name),
          brand: toStr(base.brand),
          category: toStr(base.category),
          subcategory: toStr(base.subcategory),
          department: toStr(base.department),
          description: toStr(base.description),
          materials: toStr(base.materials),
          care_instructions: toStr(base.care_instructions),
          warranty: toStr(base.warranty),
          price_cop: toNum(base.price_cop),
          weight_grams: toNum(base.weight_grams),
          images: imgs.filter(Boolean),
          variants: Object.values(porColor),
          active: true,
          updated_at: new Date(),
          created_at: new Date(),
        };

        if (!producto.sku) {
          appendLog("Producto sin SKU, se omite.");
          continue;
        }
        productos.push(producto);
      }

      setParsed(productos);
      appendLog(`Leídas ${rows.length} filas → ${productos.length} productos únicos por SKU.`);
    } catch (err) {
      console.error(err);
      appendLog(`❌ Error leyendo archivo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadAll = async () => {
    if (!parsed.length) return;
    setLoading(true);
    try {
      const chunkSize = 450;
      for (let i = 0; i < parsed.length; i += chunkSize) {
        const batch = writeBatch(db);
        const slice = parsed.slice(i, i + chunkSize);
        slice.forEach((p) => {
          const categoriaId = sanitizeId(p.category || "sin_categoria");
          const ref = doc(db, "productos", categoriaId, "items", p.sku);
          setDoc(ref, { ...p, updated_at: new Date() }, { merge: true });
        });
        await batch.commit();
      }
      onMergeRows(parsed);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Carga por lotes (Excel)"
      footer={
        <>
          <button className="ap-btn" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
          <button
            className="ap-btn ap-btn--primary"
            onClick={uploadAll}
            disabled={!parsed.length || loading}
            title={!parsed.length ? "Sube un archivo primero" : "Subir a Firestore"}
          >
            {loading ? "Procesando…" : `Subir ${parsed.length} productos`}
          </button>
        </>
      }
    >
      <div className="ap-form-grid">
        <label className="span-2">
          Archivo (.xlsx, .xls, .csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={loading}
          />
        </label>

        <div className="ap-hint">
          Columnas esperadas: <strong>COD Ref SKU, Nombre, Marca, Categoría, Sub-Categoría, Departamento, Descripción, Materiales y composición, Cuidados y lavado, Garantía, Precio (COL), Peso (Gr), Imagen Principal, Imagen1, Imagen2, Color, Talla, Cantidad</strong>.
        </div>

        <div className="ap-summary">
          {rawCount ? `Filas leídas: ${rawCount}. ` : ""}
          {parsed.length ? `Productos únicos: ${parsed.length}.` : ""}
        </div>

        {parsed.length > 0 && (
          <div className="ap-table preview">
            <div className="ap-thead">
              <div>SKU</div>
              <div>Nombre</div>
              <div>Categoría</div>
              <div>Precio</div>
              <div>Variantes</div>
              <div>Imágenes</div>
            </div>
            <div className="ap-tbody">
              {parsed.slice(0, 20).map((p) => (
                <div key={p.sku} className="ap-row">
                  <div className="ap-cell mono">{p.sku}</div>
                  <div className="ap-cell">{p.name}</div>
                  <div className="ap-cell">{p.category || "—"}</div>
                  <div className="ap-cell">{currencyCO(p.price_cop)}</div>
                  <div className="ap-cell">
                    {p.variants?.map((v) => `${v.color}(${v.tallas?.length || 0})`).join(", ")}
                  </div>
                  <div className="ap-cell">{p.images?.length || 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ap-log">
          {log.map((l, i) => (
            <div key={i} className="ap-log-line">{l}</div>
          ))}
        </div>
      </div>
    </Modal>
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

  const [batchOpen, setBatchOpen] = useState(false);

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
        weight_grams: Number(row.weight_grams || 0),
        warranty: row.warranty || "",
        care_instructions: row.care_instructions || "",
        materials: row.materials || "",
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
      if (!toStr(draft.sku)) {
        alert("El SKU es obligatorio.");
        return;
      }
      if (!toStr(draft.name)) {
        alert("El nombre es obligatorio.");
        return;
      }

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
        sku: toStr(draft.sku) || editing?.sku || "",
        name: toStr(draft.name),
        brand: toStr(draft.brand),
        department: toStr(draft.department),
        category: toStr(draft.category),
        subcategory: toStr(draft.subcategory),
        description: toStr(draft.description),
        price_cop: Number(draft.price_cop || 0),
        images: draft.images || [],
        active: !!draft.active,
        variants: variantsClean,
        weight_grams: Number(draft.weight_grams || 0),
        warranty: toStr(draft.warranty),
        care_instructions: toStr(draft.care_instructions),
        materials: toStr(draft.materials),
        updated_at: new Date(),
      };

      if (creating) {
        const categoriaId = sanitizeId(payload.category || "sin_categoria");
        const ref = doc(db, "productos", categoriaId, "items", payload.sku); // ID = SKU
        await setDoc(ref, { ...payload, created_at: new Date() }, { merge: true });
        setRows((prev) => [
          ...prev,
          {
            id: payload.sku,
            ref,
            catSlug: categoriaId,
            ...payload,
          },
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

  const mergeUploadedRows = (uploaded) => {
    setRows((prev) => {
      const byKey = new Map(prev.map((r) => [`${r.catSlug}-${r.id}`, r]));
      uploaded.forEach((p) => {
        const catSlug = sanitizeId(p.category || "sin_categoria");
        const key = `${catSlug}-${p.sku}`;
        const ref = doc(db, "productos", catSlug, "items", p.sku);
        const base = { id: p.sku, ref, catSlug, ...p };
        byKey.set(key, { ...(byKey.get(key) || {}), ...base });
      });
      return Array.from(byKey.values());
    });
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
            className="ap-btn"
            onClick={() => setBatchOpen(true)}
            title="Cargar productos desde Excel"
          >
            Añadir por lotes
          </button>
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
                      href={`https://dleongold.com/products/${r.catSlug}/${r.sku || r.id}`}
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

      {/* Modal: Carga por lotes */}
      <BatchUploadModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onMergeRows={(uploaded) => {
          mergeUploadedRows(uploaded);
          setBatchOpen(false);
        }}
      />

      {/* Modal de edición / creación (no cierra por fuera) */}
      <Modal
        open={!!editing || creating}
        title={creating ? "Nuevo producto" : "Editar producto"}
        onClose={onCloseModal}
        footer={
          <>
            <button className="ap-btn" onClick={onCloseModal}>
              Cancelar
            </button>
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
            <button className="ap-btn ap-btn--primary" onClick={onSave}>
              Guardar
            </button>
          </>
        }
      >
        <ProductForm value={draft} onChange={setDraft} />
      </Modal>
    </div>
  );
}
