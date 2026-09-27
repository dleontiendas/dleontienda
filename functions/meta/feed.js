import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebasebaseAdmin.js";
import { buildCatalog, catalogXml, publicImage } from "./catalog.js";
const checks = new Map();
export async function checkPublicImage(url, fetcher = fetch) {
  if (!url || publicImage(url) !== url) return false;
  try {
    let target = url;
    for (let redirect = 0; redirect <= 3; redirect++) {
      const response = await fetcher(target, { redirect: "manual", signal: AbortSignal.timeout(6000) });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = new URL(response.headers.get("location"), target).href;
        await response.body?.cancel();
        if (publicImage(next) !== next) return false;
        target = next; continue;
      }
      const valid = response.ok && /^image\/(jpeg|png|webp|gif)(;|$)/i.test(response.headers.get("content-type") || "");
      await response.body?.cancel();
      return valid;
    }
  } catch { /* Private/error responses never enter the public catalog. */ }
  return false;
}
async function cachedImage(url) {
  if (checks.get(url)?.expires > Date.now()) return checks.get(url).valid;
  const valid = await checkPublicImage(url);
  if (checks.size > 2000) checks.clear();
  checks.set(url, { valid, expires: Date.now() + (valid ? 300000 : 30000) });
  return valid;
}
export async function validateCatalogImages(rows, checker = cachedImage) {
  const urls = [...new Set(rows.flatMap(row => [row.image_link, ...row.additional_image_link]))];
  const valid = new Set();
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(8, urls.length) }, async () => {
    while (index < urls.length) {
      const url = urls[index++];
      if (await checker(url)) valid.add(url);
    }
  }));
  return rows.flatMap(row => {
    const images = [row.image_link, ...row.additional_image_link].filter(url => valid.has(url));
    return images.length ? [{ ...row, image_link: images[0], additional_image_link: images.slice(1) }] : [];
  });
}
let cached, pending;
export async function metaCatalogHandler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) { res.set("Allow", "GET, HEAD").status(405).send("Method not allowed"); return; }
  try {
    if (!cached || cached.expires <= Date.now()) {
      pending ||= (async () => {
        const snapshot = await db.collectionGroup("items").get();
        const products = snapshot.docs.filter(doc => /^productos\/[^/]+\/items\/[^/]+$/.test(doc.ref.path)).map(doc => ({ ...doc.data(), id: doc.id, catSlug: doc.ref.parent.parent.id }));
        const { rows, rejected } = buildCatalog(products);
        const verified = await validateCatalogImages(rows);
        // A transient outage must not replace an established catalog with an empty file.
        if (!verified.length) throw new Error("EMPTY_CATALOG");
        console.info("meta_catalog", { exported: verified.length, excluded: rejected.length + rows.length - verified.length });
        cached = { xml: catalogXml(verified), expires: Date.now() + 60000 };
      })().finally(() => { pending = null; });
      await pending;
    }
    res.set("Cache-Control", "public, max-age=60, s-maxage=60").type("application/xml; charset=utf-8").status(200).send(cached.xml);
  } catch {
    console.warn("meta_catalog_unavailable");
    res.set("Cache-Control", "no-store").status(503).send("Catalog temporarily unavailable");
  }
}
export const metaCatalog = onRequest({ timeoutSeconds: 300, memory: "512MiB", maxInstances: 3 }, metaCatalogHandler);
