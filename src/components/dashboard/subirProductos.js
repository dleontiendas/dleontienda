// subirProductos.js
// Ejecuta: node subirProductos.js
// Reqs: npm i firebase-admin xlsx

const admin = require("firebase-admin");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

/* ⚠️ RECOMENDADO: usa GOOGLE_APPLICATION_CREDENTIALS con la ruta al JSON.
   Si no está, tomará el objeto serviceAccount embebido (no recomendado en repo). */
const serviceAccount = {
  type: "service_account",
  project_id: "dleongold-10de3",
  private_key_id: "f0e009bf34a60b0d9101a85bc6234839df89754a",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDBcIYC8XQIHVGz
+f0jAxRkSuBQODLni3mczNHvrM2HdDRF+H+WZqBqoAe+saKHeQubeR5AfCBCJAb/
vnyFS/2pF4lk1GdVavPoQVCHwPmUDEfYWJfahmVKdtnZSraw/HScoEbtTZkD/VYC
Eq1yHy5Uj62eEpw99vtbXEZXVxAMhuUiX2fW/BoLLsvFC/2HHTMNKrCW8tvG0I97
OGw27FANx6GzMJdCCDpwWTKe7ZC/okdOp0rdQ4zQEjesM/DdrtIsE7jGCPB8ORnF
VG/l/ygRdHLOzPynbSRilIpgcJUFvXQGLuh35RqY8IM3/i4GVkkqIUXufzphevmR
uwG3TIjTAgMBAAECggEABm7bDhMAlFqBQpaAPB9YmMNCtXhA/SFO0I+hNbLN/QC4
0lDi0VolYJZk24slyBKW97st7eAS5JA1KWEo2/f8fhiZyaAktZsCdIljh7g7tJg5
9XBw0GQizzinownQjI9Aw4qzASZQ/eh5aUU8vmxaCpbio7yjtI3XqyCk+DedgYUW
EOoO1sGClII9f8x5YuJ5P01+xiArfl2XrnAAWG32GLkiGZpQ+HOLRR5Nj4QR2H5P
U96RJBkufcmqKjrRfqQCyVhgmM9eo5lg3ZXdn74+iM8lMj4PYdrIUwkGxriYpLg1
e+NC7bmc2ClvKyHcBWdbYicu7mGM0mWEjDY+SH4iYQKBgQD0Y8ZmGJpW/tMh9iYx
hQ9f+w0Ke1fzjBjfKggXD1tf07dWmc016hphDQxUUUeFNYvSZ0gmuS+HQq5TFsly
Wug7EZJ9gu1yR1JkgvsY2V3ztv9JPy08lBZqz97SAVNTEQ5X2D+gG1U/VWl1Hl70
u4RAg68quzMBM5p8MGjIAZRPoQKBgQDKoRnjKu5R4AnpWTUtR6oWSHhvW69ju4AR
GV/tvaRB1qrFhYSrx85nMxM78FAU/MRu5HKUS0V2BaYlFKAHWrjMJxzAuzZWkXTH
HffxUVuyBvuIqBV8yDR2/ugDsR1zIjdldkKVASy2s7ngKohcNISJUwrozaPSwxFM
181hgBwT8wKBgQCiW8LLwx6OGx8DGfeHwIFVX4DrbMQifflsEQ1s3Hv07r+HXghS
ACPkQ/nj7leYbNlmP81URIUJ1Efh1WqheTl9PJBYp+m9mRpowge1G3tqVTHGZJ1V
+H/oGA9M7yp/Lf6cZ4LliCMbP1AfSb0F06np/lIaDmG1M6Y3SSXjcgEo4QKBgAw8
yolzsEz1kOOs5Y9EgrsxyURAb0lAq61csPR0vZTUWB/xvl95g7er1/+Ite1ujpZ7
6YeXPCyyjqQyqK+JBRwfSJdDNzbnNfxIjQ7f8P/BeDN6o0GT/ccqAe0nJzYq3Nmd
2MuS9JZcKF+ncfDPoymAAGqq8Lfr3AGeDuNSj1+NAoGBAKB8918zFUd78kU5ZfrY
C8dXnQSphJbRgJn9HvsnzxOSSeieJKUhipL1woIicOkQi+Tq8lt3+JK/ix+V8c7w
T8Wf0Z/7/9Sucl4aV1NCGQrncBSk3dvSXJv4FPrPEAeLkc3ObZcjYjTJveiN/kSf
h5aYjGPhm/NhLza2CFa5rORL
-----END PRIVATE KEY-----`,
  client_email:
    "firebase-adminsdk-fbsvc@dleongold-10de3.iam.gserviceaccount.com",
  client_id: "114376104024271369266",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dleongold-10de3.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// ---------- Inicialización Admin SDK ----------
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const creds = serviceAccountPath
  ? require(path.resolve(serviceAccountPath))
  : serviceAccount;

admin.initializeApp({
  credential: admin.credential.cert(creds),
});
const db = admin.firestore();

// ---------- Utils ----------
const toStr = (v) => (v === undefined || v === null ? "" : String(v).trim());
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const sanitizeId = (s) =>
  toStr(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 120);

const normalizeDriveLink = (url) => {
  const u = toStr(url);
  if (!u) return null;
  const m = u.match(/\/d\/([a-zA-Z0-9-_]+)/) || u.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const id = m ? m[1] : null;
  return id
    ? `https://drive.google.com/thumbnail?authuser=0&sz=w1200&id=${id}`
    : u;
};

// Batches (≤500 ops)
async function commitInChunks(ops, size = 450) {
  for (let i = 0; i < ops.length; i += size) {
    const chunk = ops.slice(i, i + size);
    const batch = db.batch();
    chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
    console.log(`✅ Batch subido (${i + chunk.length}/${ops.length})`);
  }
}

// ---------- Lectura Excel ----------
const excelPath = process.env.EXCEL_FILE || "./Matriz de productos (Moda).xlsx";
if (!fs.existsSync(excelPath)) {
  console.error(`No se encontró el archivo: ${excelPath}`);
  process.exit(1);
}
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0] || "Sheet1";
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

// ---------- Agrupación por SKU ----------
const acc = new Map();

for (const r of rows) {
  const sku = toStr(r["COD Ref SKU"]);
  if (!sku) {
    console.warn("Fila sin SKU, se omite.");
    continue;
  }

  const nombre = toStr(r["Nombre"]);
  const marca = toStr(r["Marca"]);
  const categoria = toStr(r["Categoría"]);
  const subcat = toStr(r["Sub-Categoría"]);
  const depto = toStr(r["Departamento"]);
  const desc = toStr(r["Descripción"]);
  const materiales = toStr(r["Materiales y composición"]);
  const cuidados = toStr(r["Cuidados y lavado"]);
  const garantia = toStr(r["Garantía"]);
  const precio = toNum(r["Precio (COL)"]);
  const peso = toNum(r["Peso (Gr)"]);

  const imgPrincipal = normalizeDriveLink(r["Imagen Principal"]);
  const img1 = normalizeDriveLink(r["Imagen1"]);
  const img2 = normalizeDriveLink(r["Imagen2"]);

  const color = toStr(r["Color"]);
  const talla = toStr(r["Talla"]);
  const cantidad = toNum(r["Cantidad"]);

  if (!acc.has(sku)) {
    acc.set(sku, {
      base: {
        sku,
        name: nombre,
        brand: marca,
        category: categoria,
        subcategory: subcat,
        department: depto,
        description: desc,
        materials: materiales,
        care_instructions: cuidados,
        warranty: garantia,
        price_cop: precio,
        weight_grams: peso, // mismo nombre que UI/Firestore
      },
      variantes: [],
      imgs: [],
    });
  }

  const entry = acc.get(sku);

  // Base: primeros valores no vacíos
  if (nombre && !entry.base.name) entry.base.name = nombre;
  if (marca && !entry.base.brand) entry.base.brand = marca;
  if (categoria && !entry.base.category) entry.base.category = categoria;
  if (subcat && !entry.base.subcategory) entry.base.subcategory = subcat;
  if (depto && !entry.base.department) entry.base.department = depto;
  if (desc && !entry.base.description) entry.base.description = desc;
  if (materiales && !entry.base.materials) entry.base.materials = materiales;
  if (cuidados && !entry.base.care_instructions) entry.base.care_instructions = cuidados;
  if (garantia && !entry.base.warranty) entry.base.warranty = garantia;
  if (precio && !entry.base.price_cop) entry.base.price_cop = precio;
  if (peso && !entry.base.weight_grams) entry.base.weight_grams = peso;

  // Imágenes únicas
  [imgPrincipal, img1, img2].forEach((u) => {
    if (u && !entry.imgs.includes(u)) entry.imgs.push(u);
  });

  // Variantes por fila
  if (color || talla || Number.isFinite(cantidad)) {
    entry.variantes.push({
      color,
      talla,
      cantidad: Math.max(0, Math.trunc(cantidad || 0)),
    });
  }
}

// ---------- Construcción y subida ----------
const ops = [];
for (const { base, variantes, imgs } of acc.values()) {
  // Agrupar tallas por color
  const porColor = {};
  for (const v of variantes) {
    const key = v.color || "sin_color";
    if (!porColor[key]) porColor[key] = { color: key, tallas: [] };
    if (v.talla) porColor[key].tallas.push({ size: v.talla, stock: v.cantidad || 0 });
  }

  const producto = {
    sku: toStr(base.sku),
    name: toStr(base.name),
    brand: toStr(base.brand),
    category: toStr(base.category),
    subcategory: toStr(base.subcategory),
    department: toStr(base.department),
    description: toStr(base.description),
    materials: toStr(base.materials),
    care_instructions: toStr(base.care_instructions),
    warranty: toStr(base.warranty),
    price_cop: toNum(base.price_cop),
    weight_grams: toNum(base.weight_grams),
    images: imgs.filter(Boolean),
    variants: Object.values(porColor),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!producto.sku) {
    console.warn("Producto sin SKU, se omite.");
    continue;
  }

  const categoriaId = sanitizeId(producto.category || "sin_categoria");
  const ref = db.collection("productos").doc(categoriaId).collection("items").doc(producto.sku); // upsert por SKU
  ops.push({ ref, data: producto });
}

(async () => {
  console.log(`🟡 Preparando subida de ${ops.length} productos...`);
  try {
    await commitInChunks(ops, 450);
    console.log("🎉 Finalizado.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al subir productos:", err);
    process.exit(1);
  }
})();
