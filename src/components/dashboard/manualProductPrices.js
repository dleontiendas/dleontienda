const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

export const normalizeManualProductPrices = (priceValue, oldPriceValue) => {
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("El precio actual debe ser un número mayor que cero.");
  }

  if (isBlank(oldPriceValue)) return { price_cop: price, oldPrice: null };

  const oldPrice = Number(oldPriceValue);
  if (!Number.isFinite(oldPrice) || oldPrice <= 0) {
    throw new Error("El precio anterior debe quedar vacío o ser un número mayor que cero.");
  }

  return { price_cop: price, oldPrice };
};

export const calculateManualSavings = (priceValue, oldPriceValue) => {
  try {
    const { price_cop: price, oldPrice } = normalizeManualProductPrices(priceValue, oldPriceValue);
    if (oldPrice === null || oldPrice <= price) return null;
    return {
      price,
      oldPrice,
      savings: oldPrice - price,
      percentage: Math.round(((oldPrice - price) / oldPrice) * 100),
    };
  } catch {
    return null;
  }
};

export const normalizeManualVariantPrices = (priceValue, oldPriceValue) => {
  const result = {};
  if (!isBlank(priceValue)) {
    const price = Number(priceValue);
    if (!Number.isFinite(price) || price <= 0) throw new Error("El precio actual de cada talla debe quedar vacío o ser mayor que cero.");
    result.price_cop = price;
  }
  if (oldPriceValue !== undefined) {
    if (isBlank(oldPriceValue)) {
      result.oldPrice = null;
    } else {
      const oldPrice = Number(oldPriceValue);
      if (!Number.isFinite(oldPrice) || oldPrice <= 0) throw new Error("El precio anterior de cada talla debe quedar vacío o ser mayor que cero.");
      result.oldPrice = oldPrice;
    }
  }
  return result;
};
