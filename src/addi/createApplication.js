import express from "express";
import { createAddiApplication } from "./addi/createApplication.js";

const app = express();
app.use(express.json());

app.post("/api/payments/addi", async (req, res) => {
  try {
    const redirectUrl = await createAddiApplication(req.body);
    res.json({ redirectUrl });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "ADDI_ERROR" });
  }
});

app.listen(3001);
