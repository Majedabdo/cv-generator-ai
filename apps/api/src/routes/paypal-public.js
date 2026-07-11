// Public + webhook PayPal endpoints (no admin auth).
import { publicConfig } from "../api/paypal-config.js";
import pb from "../utils/pocketbaseClient.js";
import logger from "../utils/logger.js";

// GET /payments/config — what the storefront needs (never the secret).
export async function paymentsConfig(req, res) {
  res.json(await publicConfig());
}

// POST /webhooks/paypal — receive PayPal webhook notifications.
export async function paypalWebhook(req, res) {
  const event = req.body || {};
  const type = event.event_type || "unknown";
  logger.info(`[paypal webhook] ${type}`);

  try {
    if (type === "PAYMENT.CAPTURE.COMPLETED" || type === "CHECKOUT.ORDER.APPROVED") {
      const capture = event.resource || {};
      const ref = capture.id || capture.custom_id || "";
      if (ref) {
        // Mark any matching pending payment as paid + unlock its resume.
        const payments = await pb
          .collection("payments")
          .getFullList({ filter: `reference = "${String(ref).replace(/"/g, "")}"` })
          .catch(() => []);
        for (const p of payments) {
          if (p.status !== "paid") {
            await pb.collection("payments").update(p.id, { status: "paid" });
          }
        }
      }
    } else if (type === "PAYMENT.CAPTURE.DENIED" || type === "PAYMENT.CAPTURE.REFUNDED") {
      const ref = event.resource?.id || "";
      if (ref) {
        const payments = await pb
          .collection("payments")
          .getFullList({ filter: `reference = "${String(ref).replace(/"/g, "")}"` })
          .catch(() => []);
        for (const p of payments) {
          await pb.collection("payments").update(p.id, {
            status: type.includes("REFUND") ? "refunded" : "failed",
          });
        }
      }
    }
  } catch (err) {
    logger.error(`paypal webhook handling failed: ${String(err)}`);
    // Still acknowledge so PayPal does not hammer retries; admin log captures it.
  }

  // Always 200 so PayPal considers it received.
  res.json({ received: true });
}
