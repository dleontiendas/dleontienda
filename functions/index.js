import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

import { processWompiWebhook } from "./payment_gateway/wompi/webhook.js";
import { addiCallback } from "./payment_gateway/addi/callback.js";
import { processBoldWebhook }
from "./payment_gateway/bold/webhook.js";

admin.initializeApp();

export const wompiWebhook = onRequest(processWompiWebhook);

export const addiWebhook = onRequest(addiCallback);

export const boldWebhook =
  onRequest(processBoldWebhook);

  