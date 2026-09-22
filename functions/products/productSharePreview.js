import { db } from "../firebasebaseAdmin.js";

const STOREFRONT_INDEX_URL = "https://dleongold-10de3.web.app/index.html";
const PUBLIC_ORIGIN = "https://dleongold.com";
const DEFAULT_IMAGE = `${PUBLIC_ORIGIN}/og-default.jpg`;

let storefrontHtmlPromise;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const plainText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

const parseDriveId = (value = "") => {
  const text = String(value).trim();
  const match =
    text.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] || "";
};

const publicImageUrl = (value, width = 1200) => {
  if (!value) return DEFAULT_IMAGE;
  const image = String(value).trim();
  if (!/drive\.google\.com/.test(image)) {
    try {
      return new URL(image, PUBLIC_ORIGIN).toString();
    } catch {
      return DEFAULT_IMAGE;
    }
  }
  const driveId = parseDriveId(image);
  return driveId
    ? `https://lh3.googleusercontent.com/d/${driveId}=w${width}`
    : DEFAULT_IMAGE;
};

const firstProductImage = (product = {}, width = 1200) => {
  const generalImage = Array.isArray(product.images)
    ? product.images.find(Boolean)
    : null;
  if (generalImage) return publicImageUrl(generalImage, width);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  for (const variant of variants) {
    const image = Array.isArray(variant?.images)
      ? variant.images.find(Boolean)
      : null;
    if (image) return publicImageUrl(image, width);
  }
  return DEFAULT_IMAGE;
};

const getStorefrontHtml = async () => {
  if (!storefrontHtmlPromise) {
    storefrontHtmlPromise = fetch(STOREFRONT_INDEX_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar el HTML de la tienda (${response.status})`);
      }
      return response.text();
    });
  }
  return storefrontHtmlPromise;
};

const getProduct = async (category, productId) => {
  const direct = await db
    .collection("productos")
    .doc(category)
    .collection("items")
    .doc(productId)
    .get();
  if (direct.exists) return direct.data();

  const bySku = await db
    .collectionGroup("items")
    .where("sku", "==", productId)
    .limit(1)
    .get();
  return bySku.empty ? null : bySku.docs[0].data();
};

const buildMetaTags = ({ title, description, image, url }) => `
    <title>${escapeHtml(title)} | D'LEON GOLD</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="D'LEON GOLD" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="400" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`;

const injectMetaTags = (html, metaTags) =>
  html
    .replace(/<title[\s\S]*?<\/title>/i, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["'](?:description|twitter:[^"']+)["'][^>]*>/gi, "")
    .replace("<head>", `<head>${metaTags}`);

export async function productSharePreviewHandler(req, res) {
  try {
    const match = req.path.match(/^\/products\/([^/]+)\/([^/]+)\/?$/);
    if (!match) {
      res.status(404).send("Producto no encontrado");
      return;
    }

    const category = decodeURIComponent(match[1]);
    const productId = decodeURIComponent(match[2]);
    const product = await getProduct(category, productId);
    const html = await getStorefrontHtml();
    if (!product) {
      res.status(404).type("html").send(html);
      return;
    }

    const title = plainText(product.name) || productId;
    const description =
      plainText(product.description) ||
      `${title} disponible en D'LEON GOLD.`;
    const url = `${PUBLIC_ORIGIN}/products/${encodeURIComponent(category)}/${encodeURIComponent(productId)}`;
    const version = req.query?.v
      ? `?v=${encodeURIComponent(String(req.query.v))}`
      : "";
    const image = `${PUBLIC_ORIGIN}/share-image/${encodeURIComponent(category)}/${encodeURIComponent(productId)}${version}`;
    const metaTags = buildMetaTags({ title, description, image, url });

    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    res.status(200).type("html").send(injectMetaTags(html, metaTags));
  } catch (error) {
    console.error("Error generando vista previa del producto", error);
    res.status(500).send("No se pudo cargar el producto");
  }
}

export async function productShareImageHandler(req, res) {
  try {
    const match = req.path.match(/^\/share-image\/([^/]+)\/([^/]+)\/?$/);
    if (!match) {
      res.status(404).send("Imagen no encontrada");
      return;
    }

    const category = decodeURIComponent(match[1]);
    const productId = decodeURIComponent(match[2]);
    const product = await getProduct(category, productId);
    if (!product) {
      res.status(404).send("Producto no encontrado");
      return;
    }

    const upstreamUrl = firstProductImage(product, 400);
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
      throw new Error(`No se pudo cargar la imagen (${upstream.status})`);
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const imageBuffer = Buffer.from(await upstream.arrayBuffer());
    res.set("Content-Type", contentType);
    res.set("Content-Length", String(imageBuffer.length));
    res.set("Cache-Control", "public, max-age=86400, s-maxage=604800, immutable");
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error("Error sirviendo imagen para compartir", error);
    res.status(500).send("No se pudo cargar la imagen");
  }
}
