import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

import { createAddiApplication } from "./addi/createApplication.js";
import { addiCallback } from "./addi/callback.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL,
}));
app.use(express.json());

/* ========= PROXY GOOGLE DRIVE (TU CÓDIGO) ========= */
app.get("/drive-img/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const driveUrl = `https://drive.google.com/uc?export=view&id=${id}`;

    const response = await fetch(driveUrl);
    if (!response.ok) {
      return res.status(404).send("Imagen no encontrada");
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (err) {
    console.error("Drive error:", err);
    res.status(500).send("Error al cargar imagen");
  }
});

/* ========= ADDI: CREAR PAGO ========= */
app.post("/api/payments/addi", async (req, res) => {
  try {
    const redirectUrl = await createAddiApplication(req.body);
    res.json({ redirectUrl });
  } catch (err) {
    console.error("ADDI ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "ADDI_ERROR" });
  }
});

/* ========= ADDI: CALLBACK ========= */
app.post("/api/addi/callback", addiCallback);

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
