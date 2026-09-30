// Stable between visits; changes whenever the dashboard saves the product.
export const productImageVersion = (product) => {
  const value = product?.updated_at || product?.updatedAt;
  if (!value) return "";
  const seconds = value.seconds ?? value._seconds;
  if (seconds !== undefined) {
    return `${seconds}-${value.nanoseconds ?? value._nanoseconds ?? 0}`;
  }
  const millis = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(millis) ? String(millis) : "";
};

export const versionProductImage = (source, product) => {
  const version = productImageVersion(product);
  if (!source || !version) return source;
  try {
    const url = new URL(source);
    // Drive images are mutable. Leave other providers (including signed URLs) intact.
    if (!["drive.google.com", "lh3.googleusercontent.com"].includes(url.hostname)) return source;
    url.searchParams.set("product_v", version);
    return url.toString();
  } catch {
    return source;
  }
};
