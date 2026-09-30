import { productImageVersion, versionProductImage } from "./productImageVersion";

const product = { updated_at: { seconds: 1790349024, nanoseconds: 981000000 } };

test("a saved change invalidates every Drive fallback while repeat visits reuse the URL", () => {
  const sources = [
    "https://lh3.googleusercontent.com/d/file-id=w1600",
    "https://drive.google.com/thumbnail?authuser=0&sz=w1600&id=file-id",
    "https://drive.google.com/uc?export=view&id=file-id",
  ];
  sources.forEach((source) => {
    const current = versionProductImage(source, product);
    expect(current).toContain("product_v=1790349024-981000000");
    expect(versionProductImage(current, product)).toBe(current);
    expect(versionProductImage(source, { updated_at: { seconds: 1790349025 } })).not.toBe(current);
  });
});

test("accepts Firestore, serialized timestamps and local dashboard dates", () => {
  expect(productImageVersion({ updated_at: { _seconds: 12, _nanoseconds: 34 } })).toBe("12-34");
  expect(productImageVersion({ updated_at: new Date("2026-09-25T15:10:24Z") })).toBe("1790349024000");
  expect(productImageVersion({ updatedAt: "2026-09-25T15:10:24Z" })).toBe("1790349024000");
});

test("preserves legacy products, placeholders, and signed non-Drive URLs", () => {
  const drive = "https://lh3.googleusercontent.com/d/file-id=w1600";
  expect(versionProductImage(drive, {})).toBe(drive);
  expect(versionProductImage(drive, { updated_at: "invalid" })).toBe(drive);
  ["/images/local.jpg", "https://example.com/signed.jpg?token=secret"].forEach((source) =>
    expect(versionProductImage(source, product)).toBe(source)
  );
});
