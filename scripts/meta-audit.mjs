// Read-only public catalog audit. Does not initialize Admin SDK or write Firestore.
import fs from "node:fs/promises";
import { buildCatalog, catalogXml } from "../functions/meta/catalog.js";
import { validateCatalogImages } from "../functions/meta/feed.js";
const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/meta-audit.mjs --live | snapshot.json");
function decode(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
  if ("mapValue" in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]));
  return null;
}
let documents;
if (source === "--live") {
  const response = await fetch("https://firestore.googleapis.com/v1/projects/dleongold-10de3/databases/(default)/documents:runQuery", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000),
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "items", allDescendants: true }] } }),
  });
  if (!response.ok) throw new Error(`Public catalog read failed: ${response.status}`);
  documents = (await response.json()).flatMap(row => row.document ? [row.document] : []);
} else documents = JSON.parse(await fs.readFile(source, "utf8"));
const products = documents.filter(doc => /\/documents\/productos\/[^/]+\/items\/[^/]+$/.test(doc.name)).map(doc => ({
  ...Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, decode(v)])), id: doc.name.split("/").at(-1), catSlug: doc.name.split("/").at(-3),
}));
const { rows, rejected } = buildCatalog(products);
const verified = await validateCatalogImages(rows);
const links = [];
for (const row of [...new Map(verified.map(row => [new URL(row.link).pathname, row])).values()].slice(0, 8)) {
  try {
    const response = await fetch(row.link, { signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    links.push({ id: row.id, link: row.link, status: response.status, html: /text\/html/.test(response.headers.get("content-type") || ""), hasApp: html.includes('id="root"') });
  } catch { links.push({ id: row.id, status: "unreachable" }); }
}
const report = { source, checkedAt: new Date().toISOString(), products: products.length, variantsBeforeImageCheck: rows.length, exported: verified.length,
  excludedByImageCheck: rows.length - verified.length, rejected, links, note: "Variant preselection requires the new code; no deployment performed. Link probes cover a sample; all exported image URLs were checked." };
await fs.mkdir("outputs/meta", { recursive: true });
await fs.writeFile("outputs/meta/catalog.local.xml", catalogXml(verified));
await fs.writeFile("outputs/meta/audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, rejected: rejected.length, links: links.map(({ id, status, hasApp }) => ({ id, status, hasApp })) }, null, 2));
