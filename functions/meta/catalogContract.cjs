// Pure contract, mirrored in functions/meta/catalogContract.cjs (parity tested).
const text = (value) => String(value ?? "").trim().normalize("NFC");
const part = (value) => encodeURIComponent(text(value));
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
const sizesOf = (variant) => Array.isArray(variant?.tallas) ? variant.tallas : (Array.isArray(variant?.sizes) ? variant.sizes : []);
function catalogId(product, variant, size) {
  const sku = text(product?.sku || product?.id);
  if (!sku || !text(variant?.color) || !text(size?.size)) return null;
  const id = text(size.sku_master)
    ? `v:${part(size.sku_master)}`
    : `l:${part(sku)}:${part(variant.color)}:${part(size.size)}`;
  return id.length <= 100 ? id : null;
}
function variantPrice(product, size) {
  const own = (key) => Object.prototype.hasOwnProperty.call(size || {}, key);
  const price = positive(own("price_cop") ? size.price_cop : product?.price_cop);
  const oldPrice = positive(own("oldPrice") ? size.oldPrice : product?.oldPrice);
  return { price, oldPrice, onSale: price !== null && oldPrice !== null && oldPrice > price };
}
function selectCatalogVariant(product, id) {
  const matches = [];
  for (const variant of product?.variants || []) {
    for (const size of sizesOf(variant)) {
      if (variant.active !== false && size.active !== false && catalogId(product, variant, size) === id) matches.push({ variant, size });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}
function commerceItem(product, color, sizeName, quantity = 1) {
  if (product?.active === false) return null;
  const variant = product?.variants?.find(v => text(v.color) === text(color) && v.active !== false);
  const size = sizesOf(variant).find(s => text(s.size) === text(sizeName) && s.active !== false);
  if (!size || !Number.isInteger(quantity) || quantity <= 0) return null;
  const id = catalogId(product, variant, size);
  const { price } = variantPrice(product, size);
  return id && price ? { id, quantity, item_price: price, color: text(variant.color), size: text(size.size) } : null;
}
module.exports = { catalogId, variantPrice, selectCatalogVariant, commerceItem, sizesOf };
