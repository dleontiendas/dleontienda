import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

import { processWompiWebhook } from "./payment_gateway/wompi/webhook.js";
import { addiCallback } from "./payment_gateway/addi/callback.js";
import { processBoldWebhook }
from "./payment_gateway/bold/webhook.js";
import { sendOrderNotification } from "./notifications/orderEmail.js";
import { importProducts } from "./products/importProducts.js";
import { createOrderWithReservation } from "./orders/createOrder.js";
import { expireInventoryReservations } from "./orders/expireReservations.js";
import { updateOrderStatus } from "./orders/updateOrderStatus.js";
import { getOrderStatus, listOrders } from "./orders/readOrders.js";
import { manageProduct } from "./products/manageProducts.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

const smtpPassword = defineSecret("SMTP_PASSWORD");

export const wompiWebhook = onRequest(processWompiWebhook);

export const addiWebhook = onRequest(addiCallback);

export const boldWebhook = onRequest(processBoldWebhook);

export {
  importProducts,
  manageProduct,
  createOrderWithReservation,
  expireInventoryReservations,
  updateOrderStatus,
  getOrderStatus,
  listOrders,
};

export const notifyNewSale = onDocumentWritten(
  {
    document: "orders/{orderId}",
    secrets: [smtpPassword],
  },
  sendOrderNotification,
);
