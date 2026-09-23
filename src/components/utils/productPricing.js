const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

export const findProductSize = (product, color, size) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const variant = variants.find((item) => String(item?.color || "") === String(color || ""));
  const sizes = Array.isArray(variant?.tallas) ? variant.tallas : Array.isArray(variant?.sizes) ? variant.sizes : [];
  return sizes.find((item) => String(item?.size || "") === String(size || "")) || null;
};

export const resolveProductPricing = (product, color, size) => {
  const selected = findProductSize(product, color, size);
  const selectedHasPrice = selected && Object.prototype.hasOwnProperty.call(selected, "price_cop");
  const selectedHasOldPrice = selected && Object.prototype.hasOwnProperty.call(selected, "oldPrice");
  const price = positiveNumber(selectedHasPrice ? selected.price_cop : product?.price_cop) || 0;
  const oldPrice = positiveNumber(selectedHasOldPrice ? selected.oldPrice : product?.oldPrice);
  const hasDiscount = oldPrice !== null && oldPrice > price && price > 0;
  const savings = hasDiscount ? oldPrice - price : 0;
  return {
    price,
    oldPrice,
    hasDiscount,
    savings,
    percentage: hasDiscount ? Math.round((savings / oldPrice) * 100) : 0,
    selectedSize: selected,
  };
};
