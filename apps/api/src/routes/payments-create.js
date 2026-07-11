// POST /payments/create — creates an official PayPal Checkout order and
// returns the approval URL to redirect the buyer to PayPal's payment page.
import { loadConfig, createOrder } from "../api/paypal-config.js";
import logger from "../utils/logger.js";

export default async (req, res) => {
  const { resumeName, returnBase } = req.body || {};

  // Validate the redirect base (must be an http(s) origin from the caller).
  let base = String(returnBase || "").replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) {
    return res.status(422).json({ error: "A valid returnBase URL is required." });
  }

  const cfg = await loadConfig();
  const description = `Resume Download - ${String(resumeName || "CVPilot Resume").slice(0, 80)}`;

  // Sandbox fallback so the redirect flow still works before the wizard is verified.
  if (!cfg.configured || !cfg.verified) {
    const orderId = `SANDBOX${Date.now().toString(36).toUpperCase()}`;
    return res.json({
      sandbox: true,
      orderId,
      approveUrl: `${base}/payment-success?order_id=${orderId}&sandbox=1`,
    });
  }

  try {
    const order = await createOrder({
      description,
      returnUrl: `${base}/payment-success`,
      cancelUrl: `${base}/payment-cancel`,
    });
    if (!order.approveUrl) throw new Error("PayPal did not return an approval URL.");
    logger.info(`[paypal] created order ${order.id}`);
    return res.json({
      sandbox: false,
      orderId: order.id,
      approveUrl: order.approveUrl,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    logger.error(`paypal order creation failed: ${String(err)}`);
    return res.status(400).json({ error: String(err.message || err) });
  }
};
