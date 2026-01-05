import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { createWompiTransaction } from "./wompi/createTransaction.js";
import { createAddiApplication } from "./addi/createApplication.js";
import { addiCallback } from "./addi/callback.js";
import { getDoc, doc } from "firebase/firestore";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "https://dleongold.com",
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

app.get("/api/payments/validate", async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ status: "ERROR" });
    }

    // Aquí puedes:
    // 1. Consultar estado en ADDI o WOMPI (opcional)
    // 2. O validar con el callback ya recibido

    // MVP: asumimos aprobado si existe
    res.json({ status: "APPROVED" });
  } catch (e) {
    res.status(500).json({ status: "ERROR" });
  }
});


/* ========= WOMPI ========= */
app.post("/api/payments/wompi", async (req, res) => {
  try {
    const redirect = await createWompiTransaction(req.body);
    res.json(redirect);
  } catch (err) {
    console.error("WOMPI ERROR:", err.message);
    res.status(500).json({ error: "WOMPI_ERROR" });
  }
});

app.get("/api/payments/validate", async (req, res) => {
  try {
    const { orderId } = req.query;

    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return res.status(404).json({ status: "ERROR" });
    }

    const order = snap.data();

    res.json({ status: order.status });
  } catch {
    res.status(500).json({ status: "ERROR" });
  }
});

export default Checkout;

