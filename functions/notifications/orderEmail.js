import nodemailer from "nodemailer";
import admin, { db } from "../firebasebaseAdmin.js";

const APPROVED = new Set(["APPROVED", "APPROVE", "PAID"]);
const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const money = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value) || 0);
const statusOf = (order = {}) => String(order.paymentStatus || order.status || "").toUpperCase();

function shouldNotify(before, after) {
  if (!after || after.emailNotification?.status === "sent") return false;
  if (!before) return APPROVED.has(statusOf(after));
  return !APPROVED.has(statusOf(before)) && APPROVED.has(statusOf(after));
}

function infoRow(label, value) {
  if (!value) return "";
  return `<tr><td style="padding:5px 12px 5px 0;font-weight:700;vertical-align:top">${escapeHtml(label)}</td><td style="padding:5px 0">${escapeHtml(value)}</td></tr>`;
}

function buildEmail(order, orderId) {
  const customer = order.customer || {};
  const delivery = order.shippingAddress || (typeof order.shipping === "object" ? order.shipping : customer);
  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items.map((item) => {
    const details = [item.quantity > 1 ? `Cantidad: ${item.quantity}` : "", item.color ? `Color: ${item.color}` : "", item.size ? `Talla: ${item.size}` : ""].filter(Boolean).join(" · ");
    const image = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:block">`
      : `<div style="width:64px;height:64px;background:#f1f5f9;border-radius:8px"></div>`;
    return `<tr><td style="padding:14px 8px 14px 0;border-bottom:1px solid #e5e7eb;width:72px">${image}</td><td style="padding:14px 8px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(item.name || "Producto")}</strong>${details ? `<div style="color:#64748b;font-size:13px;margin-top:5px">${escapeHtml(details)}</div>` : ""}</td><td style="padding:14px 0 14px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap">${money((item.price || 0) * (item.quantity || 1))}</td></tr>`;
  }).join("");
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
  const recipientName = [delivery.first_name, delivery.last_name].filter(Boolean).join(" ");
  const address = [delivery.address, delivery.city, delivery.province].filter(Boolean).join(", ");
  const shippingCost = Number(order.shippingCost) || Number(order.shipping) || (Number(order.total) || 0) - (Number(order.subtotal) || 0);

  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:680px;margin:0 auto;padding:28px 14px"><div style="background:#173b78;color:#fff;border-radius:14px 14px 0 0;padding:24px 28px"><div style="font-size:13px;opacity:.85;text-transform:uppercase;letter-spacing:1px">Nueva venta confirmada</div><h1 style="font-size:25px;margin:8px 0 0">Orden #${escapeHtml(orderId)}</h1></div><div style="background:#fff;border:1px solid #dbe5f1;border-top:0;padding:26px 28px"><h2 style="font-size:20px;margin:0 0 10px">Resumen de la compra</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemRows}</table><table role="presentation" width="100%" style="margin-top:16px"><tr><td style="padding:4px 0;color:#64748b">Subtotal</td><td style="padding:4px 0;text-align:right">${money(order.subtotal)}</td></tr><tr><td style="padding:4px 0;color:#64748b">Envío</td><td style="padding:4px 0;text-align:right">${money(shippingCost)}</td></tr><tr><td style="padding:12px 0 0;font-size:19px;font-weight:700">Total</td><td style="padding:12px 0 0;text-align:right;font-size:19px;font-weight:700;color:#173b78">${money(order.total)}</td></tr></table></div><div style="background:#fff;border:1px solid #dbe5f1;border-radius:0 0 14px 14px;margin-top:12px;padding:26px 28px"><h2 style="font-size:20px;margin:0 0 12px">Información del cliente</h2><table role="presentation" cellspacing="0" cellpadding="0">${infoRow("Nombre", customerName)}${infoRow("Documento", customer.document)}${infoRow("Email", customer.email)}${infoRow("Teléfono", customer.phone)}</table><h2 style="font-size:20px;margin:24px 0 12px">Datos de entrega</h2><table role="presentation" cellspacing="0" cellpadding="0">${infoRow("Recibe", recipientName || customerName)}${infoRow("Teléfono", delivery.phone)}${infoRow("Dirección", address)}${infoRow("Código postal", delivery.postal_code)}${infoRow("Referencia", delivery.reference)}${infoRow("Medio de pago", order.paymentProvider || order.paymentMethod)}</table></div></div></body></html>`;
  const textItems = items.map((item) => `- ${item.name || "Producto"} x${item.quantity || 1}: ${money((item.price || 0) * (item.quantity || 1))}`).join("\n");
  const text = `Nueva venta confirmada\nOrden: ${orderId}\n\n${textItems}\n\nTotal: ${money(order.total)}\nCliente: ${customerName}\nDocumento: ${customer.document || ""}\nEmail: ${customer.email || ""}\nTeléfono: ${customer.phone || ""}\nEntrega: ${address}`;
  return { html, text };
}

function mailConfig() {
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "ORDER_NOTIFICATION_EMAIL"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables de correo: ${missing.join(", ")}`);
  return {
    transport: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || "false") === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } },
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ORDER_NOTIFICATION_EMAIL,
  };
}

export async function sendOrderNotification(event) {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  if (!shouldNotify(before, after)) return;
  const orderRef = db.collection("orders").doc(event.params.orderId);
  try {
    const config = mailConfig();
    const content = buildEmail(after, event.params.orderId);
    const result = await nodemailer.createTransport(config.transport).sendMail({ from: config.from, to: config.to, replyTo: after.customer?.email || undefined, subject: `Nueva venta #${event.params.orderId} - ${money(after.total)}`, html: content.html, text: content.text });
    await orderRef.update({ emailNotification: { status: "sent", sentAt: admin.firestore.FieldValue.serverTimestamp(), messageId: result.messageId || null, recipient: config.to } });
  } catch (error) {
    await orderRef.update({ emailNotification: { status: "failed", failedAt: admin.firestore.FieldValue.serverTimestamp(), error: String(error.message || error).slice(0, 500) } });
    throw error;
  }
}

export { buildEmail, shouldNotify };
