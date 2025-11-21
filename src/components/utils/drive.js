// src/utils/drive.js
export const parseDriveId = (urlOrId = "") => {
  const s = String(urlOrId).trim();
  const m =
    s.match(/\/d\/([a-zA-Z0-9_-]+)/) || // .../file/d/ID/view
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/); // ...?id=ID
  return m ? m[1] : s; // si ya pasas el ID, lo deja tal cual
};

// 1) vista directa (suele funcionar si el archivo es "cualquiera con el enlace")
export const driveView = (urlOrId) =>
  `https://drive.google.com/uc?export=view&id=${parseDriveId(urlOrId)}`;

// 2) thumbnail con tamaño (más confiable, pero a veces comprime)
export const driveThumb = (urlOrId, w = 1920) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(urlOrId)}`;

// 3) googleusercontent (variante que a veces sortea bloqueos)
export const driveLH3 = (urlOrId, w = 1920) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(urlOrId)}=w${w}`;