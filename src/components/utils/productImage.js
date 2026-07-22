const normalize = (value) => String(value || "").trim().toLowerCase();

export const getSelectedProductImage = (product, selectedColor) => {
  const color = normalize(selectedColor);
  const selectedVariant = Array.isArray(product?.variants)
    ? product.variants.find((variant) => normalize(variant?.color) === color)
    : null;

  return (
    (Array.isArray(selectedVariant?.images) && selectedVariant.images[0]) ||
    (Array.isArray(product?.images) && product.images[0]) ||
    ""
  );
};

export const getEmailProductImage = (product, selectedColor) => {
  const image = getSelectedProductImage(product, selectedColor);
  if (!image) return "";

  const value = String(image).trim();
  const driveId =
    value.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
    value.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];

  return driveId
    ? `https://lh3.googleusercontent.com/d/${driveId}=w320`
    : value;
};
