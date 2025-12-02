import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/drive-img/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const driveUrl = `https://drive.google.com/uc?export=view&id=${id}`;

    const response = await fetch(driveUrl);

    if (!response.ok) {
      return res.status(404).send("Imagen no encontrada");
    }

    // Obtener headers del archivo original
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Convertir el cuerpo a buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    // Enviar la imagen con el header correcto
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (err) {
    console.error("Error al cargar imagen desde Drive:", err);
    res.status(500).send("Error al cargar imagen");
  }
});

app.listen(PORT, () => {
  console.log("Proxy activo en puerto", PORT);
});