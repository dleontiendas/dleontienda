import { driveView, driveThumb, driveLH3, parseDriveId } from "./drive";

export const driveFallbackSrc = (urlOrId) => {
  const id = parseDriveId(urlOrId);

  // orden de prueba: el que más funciona en iPhone → lh3 primero
  return [
    driveLH3(id, 1600),   // 1) normalmente funciona en Safari
    driveThumb(id, 1600), // 2) thumbnail google
    driveView(id)         // 3) uc?export=view
  ];
};
