import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

import { processWompiWebhook } from "./payment_gateway/wompi/webhook.js";
import { addiCallback } from "./payment_gateway/addi/callback.js";
import { processBoldWebhook }
from "./payment_gateway/bold/webhook.js";
import { sendOrderNotification } from "./notifications/orderEmail.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

const smtpPassword = defineSecret("SMTP_PASSWORD");

export const wompiWebhook = onRequest(processWompiWebhook);

export const addiWebhook = onRequest(addiCallback);

export const boldWebhook =
  onRequest(processBoldWebhook);

export const notifyNewSale = onDocumentWritten(
  {
    document: "orders/{orderId}",
    secrets: [smtpPassword],
  },
  sendOrderNotification,
);
