import contract from "./catalogContract.cjs";
const { catalogId, variantPrice, sizesOf } = contract;
export const ORIGIN = "https://dleongold.com";
export const cleanText = (value = "") => String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
export const xmlEscape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const imageHosts = new Set(["dleongold.com", "www.dleongold.com", "lh3.googleusercontent.com", "drive.google.com"]);
export function publicImage(raw) {
  try {
    const url = new URL(raw, ORIGIN);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !imageHosts.has(url.hostname)) return null;
    if (url.hostname === "drive.google.com") {
      const id = url.pathname.match(/\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id");
      return id && /^[\w-]+$/.test(id) ? `https://lh3.googleusercontent.com/d/${id}=w1200` : null;
    }
    return url.href;
  } catch { return null; }
}
export function buildCatalog(products) {
  const candidates = [], rejected = [];
  const skuCounts = new Map();
  for (const product of products) {
    const sku = String(product.sku || product.id || "").trim();
    skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
  }
  for (const product of products) {
    if (product.active === false) continue;
    const sku = String(product.sku || product.id || "").trim();
    const title = cleanText(product.name), description = cleanText(product.description);
    const group = `p:${encodeURIComponent(sku)}`;
    if (!sku || skuCounts.get(sku) !== 1 || !product.id || !product.catSlug || !title || !description || group.length > 100) {
      rejected.push({ product: product.id, reason: "incomplete_or_duplicate_product" }); continue;
    }
    let count = 0;
    for (const variant of product.variants || []) {
      if (variant.active === false) continue;
      const images = [...new Set([...(variant.images || []), ...(product.images || [])].filter(Boolean).map(publicImage).filter(Boolean))];
      for (const size of sizesOf(variant)) {
        if (size.active === false) continue;
        const id = catalogId(product, variant, size), pricing = variantPrice(product, size);
        if (!id || !pricing.price || !images.length || size.stock === null || size.stock === "" || !Number.isInteger(Number(size.stock)) || Number(size.stock) < 0) {
          rejected.push({ product: product.id, reason: "incomplete_variant" }); continue;
        }
        const link = `${ORIGIN}/products/${encodeURIComponent(product.catSlug)}/${encodeURIComponent(product.id)}?variant=${encodeURIComponent(id)}`;
        candidates.push({ id, title: `${title} — ${variant.color} / ${size.size}`.slice(0, 150), description: description.slice(0, 5000),
          availability: Number(size.stock) > 0 ? "in stock" : "out of stock", condition: "new",
          price: `${pricing.onSale ? pricing.oldPrice : pricing.price} COP`, ...(pricing.onSale ? { sale_price: `${pricing.price} COP` } : {}),
          link, image_link: images[0], additional_image_link: images.slice(1, 11), brand: cleanText(product.brand) || "D'LEON GOLD",
          product_type: [product.category, product.department, product.subcategory].map(cleanText).filter(Boolean).join(" > "),
          item_group_id: group, color: cleanText(variant.color), size: cleanText(size.size), mpn: String(size.sku_master || sku) });
        count++;
      }
    }
    if (!count) rejected.push({ product: product.id, reason: "no_exportable_variants" });
  }
  const counts = new Map();
  candidates.forEach(row => counts.set(row.id, (counts.get(row.id) || 0) + 1));
  const rows = candidates.filter(row => {
    if (counts.get(row.id) === 1) return true;
    rejected.push({ id: row.id, reason: "duplicate_variant_id" }); return false;
  }).sort((a, b) => a.id.localeCompare(b.id));
  return { rows, rejected };
}
export function catalogXml(rows) {
  const items = rows.map(row => `<item>${Object.entries(row).flatMap(([field, value]) => (Array.isArray(value) ? value : [value]).filter(v => v !== "").map(v => `<g:${field}>${xmlEscape(v)}</g:${field}>`)).join("")}</item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>D'LEON GOLD</title><link>${ORIGIN}</link><description>Catálogo de productos</description>${items}</channel></rss>`;
}
