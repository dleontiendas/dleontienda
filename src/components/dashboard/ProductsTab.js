// ========================= src/admin/ProductsTab.jsx =========================
import React, { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  setDoc,
  doc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "../../Firebase";

/* ---------- HELPERS ---------- */
const toStr = (v) => (v == null ? "" : String(v).trim());
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const sanitizeId = (s) =>
  toStr(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();

const normalizeDriveLink = (url) => {
  const m = String(url || "").match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m
    ? `https://drive.google.com/thumbnail?id=${m[1]}`
    : url;
};

/* ========================= BATCH UPLOAD ========================= */
function BatchUploadModal({ open, onClose, onMergeRows }) {
  const [parsed, setParsed] = useState([]);
  const [loading, setLoading] = useState(false);

  const normalizeKey = (k) =>
    k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const findKey = (keys, variants) =>
    keys.find((k) => variants.some((v) => k.includes(v)));

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const raw = XLSX.utils.sheet_to_json(
        wb.Sheets[wb.SheetNames[0]],
        { defval: "" }
      );

      const headers = Object.keys(raw[0] || {});
      const normalized = headers.map((h) => ({
        original: h,
        key: normalizeKey(h),
      }));

      const get = (row, variants) => {
        const k = findKey(
          normalized.map((x) => x.key),
          variants
        );
        const original = normalized.find((x) => x.key === k)?.original;
        return row[original] ?? "";
      };

      const acc = new Map();

      raw.forEach((row) => {
        const sku = toStr(get(row, ["sku"]));
        if (!sku) return;

        if (!acc.has(sku)) {
          acc.set(sku, {
            base: {
              sku,
              name: get(row, ["nombre"]),
              price_cop: toNum(get(row, ["precio"])),
            },
            variantes: {},
            imgs: [],
          });
        }

        const entry = acc.get(sku);

        const color = toStr(get(row, ["color"]));
        const talla = toStr(get(row, ["talla"]));
        const stock = toNum(get(row, ["stock", "cantidad"]));

        const img = normalizeDriveLink(get(row, ["imagen"]));
        if (img && !entry.imgs.includes(img)) entry.imgs.push(img);

        if (color) {
          if (!entry.variantes[color]) {
            entry.variantes[color] = { color, tallas: [] };
          }
          if (talla) {
            entry.variantes[color].tallas.push({
              size: talla,
              stock,
            });
          }
        }
      });

      const productos = [];

      for (const { base, variantes, imgs } of acc.values()) {
        productos.push({
          ...base,
          images: imgs,
          variants: Object.values(variantes),
          active: true,
        });
      }

      setParsed(productos);
    } catch (e) {
      console.error(e);
      alert("Error leyendo Excel");
    }

    setLoading(false);
  };

  const uploadAll = async () => {
    setLoading(true);

    for (const p of parsed) {
      const cat = sanitizeId(p.category || "ropa");
      const ref = doc(db, "productos", cat, "items", p.sku);
      await setDoc(ref, p, { merge: true });
    }

    onMergeRows(parsed);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <button onClick={uploadAll} disabled={loading}>
        Subir {parsed.length}
      </button>
    </div>
  );
}

/* ========================= MAIN ========================= */
export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [batchOpen, setBatchOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collectionGroup(db, "items"));
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data(), ref: d.ref })));
    })();
  }, []);

  return (
    <div>
      <h2>Productos</h2>

      <button onClick={() => setBatchOpen(true)}>
        Subir Excel
      </button>

      <BatchUploadModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onMergeRows={(data) => setRows((prev) => [...prev, ...data])}
      />

      {rows.map((r) => (
        <div key={r.id}>
          {r.name} - {r.sku}
        </div>
      ))}
    </div>
  );
}