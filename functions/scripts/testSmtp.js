import nodemailer from "nodemailer";

const required = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "ORDER_NOTIFICATION_EMAIL",
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Faltan variables: ${missing.join(", ")}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE) === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

try {
  await transporter.verify();
  console.log("Conexión y autenticación SMTP: OK");

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ORDER_NOTIFICATION_EMAIL,
    subject: "Prueba local de correo - D'LEON GOLD STORE",
    text: "La conexión SMTP de Hostinger funciona correctamente. Este mensaje fue enviado desde una prueba local.",
    html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2 style="color:#173b78">Prueba local exitosa</h2><p>La conexión SMTP de Hostinger funciona correctamente.</p><p><strong>D'LEON GOLD STORE</strong></p></div>`,
  });

  console.log(`Correo de prueba enviado: ${result.messageId}`);
} catch (error) {
  console.error(`Prueba SMTP fallida: ${error.message}`);
  process.exit(1);
}
