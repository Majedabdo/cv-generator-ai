// Payment gateway abstraction layer.
//
// Each gateway exposes a `charge()` that returns a normalized result.
// Real gateways (Stripe / PayPal / STC Pay / Mada) plug in here by reading
// their secret from process.env and calling their API. When a gateway's
// secret is not configured, we fall back to a sandbox authorization so the
// full post-payment flow (account, invoice, unlock) still works end to end.
//
// To go live: add the secret key to apps/api/.env and implement the real
// branch inside the matching gateway below. The rest of the app is unchanged.

import logger from "../utils/logger.js";

const SUPPORTED = [
  "card",
  "stripe",
  "paypal",
  "apple_pay",
  "google_pay",
  "visa",
  "mastercard",
  "mada",
  "stc_pay",
];

function sandboxAuthorize(method, amount, currency) {
  logger.info(
    `[payments] sandbox authorization via ${method} for ${amount} ${currency}`,
  );
  return {
    ok: true,
    provider: method,
    mode: "sandbox",
    reference: `${method.toUpperCase()}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  };
}

// Stripe (card / apple_pay / google_pay / visa / mastercard).
async function chargeStripe(method, amount, currency) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return sandboxAuthorize(method, amount, currency);

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amount),
      currency: currency.toLowerCase(),
      "automatic_payment_methods[enabled]": "true",
      confirm: "true",
    }),
  });
  if (!res.ok) {
    throw new Error(`stripe charge failed: ${res.status} ${res.statusText}`);
  }
  const intent = await res.json();
  return { ok: true, provider: "stripe", mode: "live", reference: intent.id };
}

async function chargePayPal(method, amount, currency) {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) return sandboxAuthorize(method, amount, currency);
  // Live implementation goes here (OAuth token + create/capture order).
  return sandboxAuthorize(method, amount, currency);
}

// Charge dispatcher. amount is in the smallest unit (e.g. halalas / cents).
export async function charge({ method, amount, currency = "SAR" }) {
  const m = String(method || "card").toLowerCase();
  if (!SUPPORTED.includes(m)) {
    const err = new Error(`Unsupported payment method: ${m}`);
    err.status = 422;
    throw err;
  }
  if (m === "paypal") return chargePayPal(m, amount, currency);
  return chargeStripe(m, amount, currency);
}

export { SUPPORTED as SUPPORTED_METHODS };
