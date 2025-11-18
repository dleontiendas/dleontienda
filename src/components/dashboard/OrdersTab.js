import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase";
import "./OrdersTab.css";

/* ---------- Utils (WHY: coherencia visual/datos) ---------- */
const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtCOP = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(
    Number(v || 0)
  );
const STATUS = ["Pendiente", "Pagado", "En preparación", "Enviado", "Entregado", "Cancelado"];
const PAYMENTS = ["Contraentrega", "Transferencia", "Tarjeta", "Nequi", "Daviplata", "PSE", "N/A"];

/* ---------- Modal genérico ---------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="od-modal-backdrop" onClick={onClose}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-head">
          <h3>{title}</h3>
          <button className="od-icon-btn" onClick={onClose} title="Cerrar">✕</button>
        </div>
        <div className="od-modal-body">{children}</div>
        {footer && <div className="od-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros/ui
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [active, setActive] = useState(null); // pedido para modal
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "pedidos"));
        const rows = snap.docs
          .map((d) => {
            const data = d.data() || {};
            const cliente = data.cliente || data.customer || {};
            const fecha = toDate(data.fecha || data.date);
            return {
              id: d.id,
              ref: d.ref,
              estado: data.estado || data.status || "Pendiente",
              metodoPago: data.metodoPago || data.paymentMethod || "N/A",
              total: Number(data.total || 0),
              fecha,
              shipping: data.envio || data.shipping || {},
              items: data.items || data.lineas || [],
              notas: data.notas || data.notes || "",
              cliente: {
                nombre: cliente.nombre || cliente.first_name || "",
                apellido: cliente.apellido || cliente.last_name || "",
                email: cliente.email || "",
                telefono: cliente.telefono || cliente.phone || "",
                documento: cliente.documento || cliente.id || "",
                direccion: cliente.direccion || cliente.address || "",
                ciudad: cliente.ciudad || cliente.city || "",
              },
            };
          })
          .sort((a, b) => (b.fecha?.getTime?.() || 0) - (a.fecha?.getTime?.() || 0));
        setOrders(rows);
      } catch (e) {
        console.error("❌ Error cargando pedidos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filtros
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    return orders.filter((o) => {
      const text =
        `${o.id} ${o.cliente.nombre} ${o.cliente.apellido} ${o.cliente.email} ${o.cliente.telefono}`.toLowerCase();
      const byText = !needle || text.includes(needle);
      const byStatus = !status || o.estado === status;
      const byPay = !pay || o.metodoPago === pay;
      const ts = o.fecha?.setHours?.(0, 0, 0, 0) || 0;
      const after = !fromDate || ts >= fromDate.setHours(0, 0, 0, 0);
      const before = !toDate || ts <= toDate.setHours(23, 59, 59, 999);
      return byText && byStatus && byPay && after && before;
    });
  }, [orders, q, status, pay, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateStatus = async (order, newStatus) => {
    try {
      setSaving(true);
      await updateDoc(order.ref, { estado: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, estado: newStatus } : o)));
      setActive((prev) => (prev && prev.id === order.id ? { ...prev, estado: newStatus } : prev));
    } catch (e) {
      console.error("❌ Error actualizando pedido:", e);
      alert("No se pudo actualizar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="od-wrap">
      <header className="od-header">
        <h2>Pedidos</h2>
        <div className="od-controls">
          <input
            className="od-search"
            placeholder="Buscar por ID, cliente, email, teléfono…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select className="od-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="od-select" value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); }}>
            <option value="">Todos los pagos</option>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input className="od-date" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <span>—</span>
          <input className="od-date" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
      </header>

      {/* Tabla */}
      {loading ? (
        <div className="od-empty">Cargando…</div>
      ) : !orders.length ? (
        <div className="od-empty">No hay pedidos registrados.</div>
      ) : (
        <>
          <div className="od-table">
            <div className="od-thead">
              <div>ID</div>
              <div>Cliente</div>
              <div>Pago</div>
              <div>Total</div>
              <div>Estado</div>
              <div>Fecha</div>
              <div>Acciones</div>
            </div>
            <div className="od-tbody">
              {pageRows.map((o) => (
                <div className="od-row" key={o.id}>
                  <div className="mono">{o.id}</div>
                  <div className="od-customer">
                    <div className="od-name">{`${o.cliente.nombre} ${o.cliente.apellido}`.trim() || "—"}</div>
                    <div className="od-sub">{o.cliente.email || "—"} · {o.cliente.telefono || "—"}</div>
                  </div>
                  <div>{o.metodoPago}</div>
                  <div className="od-total">{fmtCOP(o.total)}</div>
                  <div>
                    <span className={`od-badge ${o.estado.toLowerCase().replace(/\s+/g, "-")}`}>{o.estado}</span>
                  </div>
                  <div>{o.fecha ? o.fecha.toLocaleDateString() : "—"}</div>
                  <div className="od-actions">
                    <button className="od-btn od-btn--ghost" onClick={() => setActive(o)}>Ver</button>
                    {/* Acciones rápidas de estado */}
                    <div className="od-quick">
                      {["En preparación", "Enviado", "Entregado"].map((s) => (
                        <button
                          key={s}
                          className={`od-chip ${o.estado === s ? "active" : ""}`}
                          onClick={() => updateStatus(o, s)}
                          title={`Marcar como ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paginación */}
          <div className="od-pager">
            <button className="od-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ← Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button className="od-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Modal detalle */}
      <Modal
        open={!!active}
        title={`Pedido ${active?.id || ""}`}
        onClose={() => setActive(null)}
        footer={
          <>
            <select
              className="od-select"
              value={active?.estado || "Pendiente"}
              onChange={(e) => updateStatus(active, e.target.value)}
              disabled={saving}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="od-btn" onClick={() => setActive(null)} disabled={saving}>Cerrar</button>
          </>
        }
      >
        {active && (
          <div className="od-detail">
            <section className="od-section">
              <h4>Cliente</h4>
              <div className="od-grid">
                <div><b>Nombre:</b> {`${active.cliente.nombre} ${active.cliente.apellido}`.trim() || "—"}</div>
                <div><b>Email:</b> {active.cliente.email || "—"}</div>
                <div><b>Teléfono:</b> {active.cliente.telefono || "—"}</div>
                <div><b>Documento:</b> {active.cliente.documento || "—"}</div>
                <div className="span-2"><b>Dirección:</b> {active.cliente.direccion || "—"}</div>
                <div><b>Ciudad:</b> {active.cliente.ciudad || "—"}</div>
              </div>
            </section>

            <section className="od-section">
              <h4>Resumen</h4>
              <div className="od-grid">
                <div><b>Pago:</b> {active.metodoPago}</div>
                <div><b>Estado:</b> {active.estado}</div>
                <div><b>Fecha:</b> {active.fecha ? active.fecha.toLocaleString() : "—"}</div>
                <div><b>Total:</b> {fmtCOP(active.total)}</div>
              </div>
            </section>

            <section className="od-section">
              <h4>Productos</h4>
              <div className="od-lines">
                <div className="od-lines-head">
                  <div>Producto</div><div>Variante</div><div>Cant.</div><div>Precio</div><div>Subtotal</div>
                </div>
                <div className="od-lines-body">
                  {(active.items || []).map((it, i) => {
                    const name = it.name || it.productName || "—";
                    const color = it.color || it.variantColor || "";
                    const size = it.size || it.variantSize || "";
                    const qty = Number(it.qty || it.quantity || 1);
                    const price = Number(it.price_cop || it.price || 0);
                    return (
                      <div className="od-line" key={i}>
                        <div className="od-ellipsis">{name}</div>
                        <div className="od-ellipsis">{[color, size].filter(Boolean).join(" · ") || "—"}</div>
                        <div>{qty}</div>
                        <div>{fmtCOP(price)}</div>
                        <div>{fmtCOP(price * qty)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {active.notas && (
              <section className="od-section">
                <h4>Notas</h4>
                <div className="od-notes">{active.notas}</div>
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}