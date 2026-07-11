// PayPal configuration: secure storage + credential verification.
// Config lives in the app_settings collection under key "paypal".
// The secret key is stored ENCRYPTED and never returned to the frontend.
import pb from "../utils/pocketbaseClient.js";
import { encrypt, decrypt, maskTail } from "../utils/crypto-store.js";
import logger from "../utils/logger.js";

const KEY = "paypal";
const SUPPORTED_CURRENCIES = ["USD", "SAR", "EUR", "GBP", "AED"];

function apiBase(environment) {
  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getRecord() {
  try {
    return await pb.collection("app_settings").getFirstListItem(`key = "${KEY}"`);
  } catch (_) {
    return null;
  }
}

// Full internal config (includes decrypted secret) — server-side ONLY.
export async function loadConfig() {
  const rec = await getRecord();
  const v = rec?.value || {};
  return {
    clientId: v.clientId || "",
    secret: decrypt(v.secretEnc || ""),
    environment: v.environment === "live" ? "live" : "sandbox",
    merchantEmail: v.merchantEmail || "",
    currency: SUPPORTED_CURRENCIES.includes(v.currency) ? v.currency : "USD",
    amount: Number(v.amount) > 0 ? Number(v.amount) : 2.69,
    successUrl: v.successUrl || "",
    cancelUrl: v.cancelUrl || "",
    webhookUrl: v.webhookUrl || "",
    verified: !!v.verified,
    configured: !!v.clientId && !!v.secretEnc,
  };
}

// Safe view for admin UI — no plaintext secret, only a masked hint.
export async function adminView() {
  const c = await loadConfig();
  return {
    clientId: c.clientId,
    secretSet: !!c.secret,
    secretHint: c.secret ? maskTail(c.secret) : "",
    environment: c.environment,
    merchantEmail: c.merchantEmail,
    currency: c.currency,
    amount: c.amount,
    successUrl: c.successUrl,
    cancelUrl: c.cancelUrl,
    webhookUrl: c.webhookUrl,
    verified: c.verified,
    configured: c.configured,
  };
}

// Public view for the storefront — only what the browser legitimately needs.
export async function publicConfig() {
  const c = await loadConfig();
  const enabled = c.configured && c.verified;
  return {
    enabled,
    clientId: enabled ? c.clientId : "",
    environment: c.environment,
    currency: c.currency,
    amount: c.amount,
  };
}

export async function saveConfig(input, currentSecret) {
  const rec = await getRecord();
  const existing = rec?.value || {};

  const clientId = String(input.clientId || "").trim();
  // Keep the existing secret when the admin leaves the field blank on edit.
  const secretPlain = input.secret ? String(input.secret).trim() : currentSecret;
  const environment = input.environment === "live" ? "live" : "sandbox";
  const currency = SUPPORTED_CURRENCIES.includes(input.currency) ? input.currency : "USD";
  const amount = Number(input.amount) > 0 ? Number(input.amount) : 2.69;

  const value = {
    clientId,
    secretEnc: secretPlain ? encrypt(secretPlain) : existing.secretEnc || "",
    environment,
    merchantEmail: String(input.merchantEmail || "").trim(),
    currency,
    amount,
    successUrl: String(input.successUrl || "").trim(),
    cancelUrl: String(input.cancelUrl || "").trim(),
    webhookUrl: String(input.webhookUrl || "").trim(),
    verified: false, // must re-verify after any change
  };

  if (rec) await pb.collection("app_settings").update(rec.id, { value });
  else await pb.collection("app_settings").create({ key: KEY, value });
  return value;
}

// Verify credentials by requesting an OAuth2 access token from PayPal.
export async function verifyCredentials() {
  const c = await loadConfig();
  if (!c.clientId || !c.secret) {
    return { ok: false, error: "Client ID and Secret Key are both required." };
  }
  const auth = Buffer.from(`${c.clientId}:${c.secret}`).toString("base64");
  let resp;
  try {
    resp = await fetch(`${apiBase(c.environment)}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch (err) {
    return { ok: false, error: `Network error reaching PayPal: ${String(err.message || err)}` };
  }

  if (!resp.ok) {
    let detail = `${resp.status} ${resp.statusText}`;
    try {
      const j = await resp.json();
      if (j.error_description) detail = j.error_description;
      else if (j.error) detail = j.error;
    } catch (_) { /* keep default */ }
    if (resp.status === 401) {
      return { ok: false, error: `Invalid PayPal credentials (${c.environment}): ${detail}` };
    }
    return { ok: false, error: `PayPal verification failed: ${detail}` };
  }

  const token = await resp.json();
  // Mark verified in storage.
  const rec = await getRecord();
  if (rec) {
    await pb.collection("app_settings").update(rec.id, { value: { ...rec.value, verified: true } });
  }
  return { ok: true, environment: c.environment, scope: token.scope ? "granted" : "granted" };
}

// Obtain an access token for API calls (orders, verification, webhooks).
export async function getAccessToken(cfg) {
  const c = cfg || (await loadConfig());
  if (!c.clientId || !c.secret) throw new Error("PayPal is not configured.");
  const auth = Buffer.from(`${c.clientId}:${c.secret}`).toString("base64");
  const resp = await fetch(`${apiBase(c.environment)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`PayPal token failed: ${resp.status} ${resp.statusText}`);
  const j = await resp.json();
  return j.access_token;
}

// Create a PayPal Checkout order with redirect (return/cancel) URLs.
// Returns the order id and the official PayPal approval URL to redirect to.
export async function createOrder({ description, returnUrl, cancelUrl }) {
  const c = await loadConfig();
  if (!c.configured || !c.verified) throw new Error("PayPal is not active.");
  const token = await getAccessToken(c);
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: c.currency,
          value: Number(c.amount).toFixed(2),
        },
        description: (description || "Resume Download").slice(0, 127),
      },
    ],
    application_context: {
      brand_name: "CVPilot AI",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };
  const resp = await fetch(`${apiBase(c.environment)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let detail = `${resp.status} ${resp.statusText}`;
    try { const j = await resp.json(); if (j.message) detail = j.message; } catch (_) { /* keep */ }
    throw new Error(`Order creation failed: ${detail}`);
  }
  const order = await resp.json();
  const approve = (order.links || []).find((l) => l.rel === "approve" || l.rel === "payer-action");
  return {
    id: order.id,
    approveUrl: approve?.href || "",
    amount: Number(c.amount).toFixed(2),
    currency: c.currency,
  };
}

// Capture an approved order (finalizes the payment).
async function captureOrder(orderId, token, environment) {
  const resp = await fetch(`${apiBase(environment)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    let detail = `${resp.status} ${resp.statusText}`;
    try { const j = await resp.json(); if (j.message) detail = j.message; } catch (_) { /* keep */ }
    throw new Error(`Order capture failed: ${detail}`);
  }
  return resp.json();
}

// Verify (and if needed capture) an order really completed on PayPal's side.
// Returns normalized transaction details for server-side validation.
export async function verifyOrder(orderId) {
  const c = await loadConfig();
  if (!c.configured || !c.verified) throw new Error("PayPal is not active.");
  if (!/^[A-Z0-9]{5,50}$/i.test(String(orderId))) throw new Error("Invalid order id format.");
  const token = await getAccessToken(c);

  let order;
  const lookup = await fetch(`${apiBase(c.environment)}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!lookup.ok) throw new Error(`Order lookup failed: ${lookup.status} ${lookup.statusText}`);
  order = await lookup.json();

  // If the buyer approved but the payment hasn't been captured yet, capture now.
  if (order.status === "APPROVED") {
    order = await captureOrder(orderId, token, c.environment);
  }

  const completed = order.status === "COMPLETED";
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = capture?.amount?.value || order.purchase_units?.[0]?.amount?.value || c.amount;
  const currency = capture?.amount?.currency_code || order.purchase_units?.[0]?.amount?.currency_code || c.currency;
  const payerEmail = order.payer?.email_address || "";

  // Server-side amount + currency validation against the configured price.
  const expected = Number(c.amount).toFixed(2);
  const amountMatch = Number(amount).toFixed(2) === expected;
  const currencyMatch = String(currency).toUpperCase() === String(c.currency).toUpperCase();

  return {
    ok: completed,
    amountMatch,
    currencyMatch,
    status: order.status,
    reference: capture?.id || order.id,
    orderId: order.id,
    amount,
    currency,
    payerEmail,
    expectedAmount: expected,
    expectedCurrency: c.currency,
  };
}

export { apiBase, SUPPORTED_CURRENCIES };
