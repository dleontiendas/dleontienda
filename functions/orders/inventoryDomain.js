export const APPROVED_STATUSES = new Set(["APPROVED", "APPROVE", "PAID", "SUCCESS"]);
export const RELEASE_STATUSES = new Set(["DECLINED", "REJECTED", "CANCELLED", "CANCELED", "VOIDED", "REFUNDED", "REFUND", "EXPIRED", "ERROR"]);
export const RESTORE_AFTER_COMMIT_STATUSES = new Set(["CANCELLED", "CANCELED", "VOIDED", "REFUNDED", "REFUND"]);

export const normalizePaymentStatus = (value) => String(value || "").trim().toUpperCase();

export function findSizeLocation(product, item) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const wantedSku = String(item?.skuMaster || item?.sku_master || "").trim();
  const wantedColor = String(item?.color || "").trim();
  const wantedSize = String(item?.size || "").trim();

  for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
    const variant = variants[variantIndex];
    const sizes = Array.isArray(variant?.tallas) ? variant.tallas : [];
    for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
      const size = sizes[sizeIndex];
      if (wantedSku && String(size?.sku_master || "").trim() === wantedSku) return { variantIndex, sizeIndex };
      if (!wantedSku && String(variant?.color || "").trim() === wantedColor && String(size?.size || "").trim() === wantedSize) {
        return { variantIndex, sizeIndex };
      }
    }
  }
  return null;
}

export function changeItemStock(product, item, delta) {
  const quantity = Math.trunc(Number(item?.quantity));
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("INVALID_QUANTITY");
  const location = findSizeLocation(product, item);
  if (!location) throw new Error("VARIANT_NOT_FOUND");
  const variants = product.variants.map((variant) => ({
    ...variant,
    tallas: Array.isArray(variant.tallas) ? variant.tallas.map((size) => ({ ...size })) : [],
  }));
  const size = variants[location.variantIndex].tallas[location.sizeIndex];
  const current = Math.max(0, Number(size.stock) || 0);
  const next = current + (delta * quantity);
  if (next < 0) throw new Error("INSUFFICIENT_STOCK");
  size.stock = next;
  return { ...product, variants };
}

export function transitionInventoryStatus(currentStatus, paymentStatus) {
  const normalized = normalizePaymentStatus(paymentStatus);
  if (APPROVED_STATUSES.has(normalized)) {
    if (currentStatus === "pending_payment") return { next: "committed", stockDelta: -1 };
    if (currentStatus === "reserved") return { next: "committed", stockDelta: 0 };
    if (currentStatus === "committed") return { next: "committed", stockDelta: 0 };
    if (currentStatus === "released") return { next: "committed", stockDelta: -1 };
    return { next: currentStatus || "not_managed", stockDelta: 0 };
  }
  if (RELEASE_STATUSES.has(normalized)) {
    if (currentStatus === "pending_payment") return { next: "released", stockDelta: 0 };
    if (currentStatus === "reserved") return { next: "released", stockDelta: 1 };
    if (currentStatus === "committed" && RESTORE_AFTER_COMMIT_STATUSES.has(normalized)) return { next: "released", stockDelta: 1 };
    return { next: currentStatus || "not_managed", stockDelta: 0 };
  }
  return { next: currentStatus || "not_managed", stockDelta: 0 };
}
