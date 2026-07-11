import pb from "../utils/pocketbaseClient.js";
import { charge } from "../api/payment-gateways.js";
import { loadConfig, verifyOrder } from "../api/paypal-config.js";
import logger from "../utils/logger.js";

function genInvoiceNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `CV-${stamp}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default async (req, res) => {
  const {
    resumeId,
    amount = 269,
    currency = "USD",
    orderId,
  } = req.body || {};
  const method = "paypal";

  if (!resumeId || typeof resumeId !== "string") {
    return res.status(422).json({ error: "resumeId is required." });
  }

  const userId = req.pocketbaseUserId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // Verify the caller owns the resume (superuser read + explicit owner check).
  let resume;
  try {
    resume = await pb.collection("resumes").getOne(resumeId);
  } catch (_) {
    return res.status(404).json({ error: "Resume not found." });
  }
  if (resume.owner !== userId) {
    return res.status(403).json({ error: "You do not own this resume." });
  }

  // Authorize the payment: verify a real PayPal order when configured,
  // otherwise fall back to the sandbox gateway.
  const cfg = await loadConfig();
  const isSandboxOrder = !orderId || String(orderId).startsWith("SANDBOX");
  let chargeResult;
  if (cfg.configured && cfg.verified && !isSandboxOrder) {
    let order;
    try {
      order = await verifyOrder(orderId);
    } catch (err) {
      return res.status(400).json({ error: `PayPal verification failed: ${String(err.message || err)}` });
    }
    if (!order.ok) return res.status(400).json({ error: `Payment not completed (status: ${order.status}).` });
    if (!order.amountMatch || !order.currencyMatch) {
      logger.error(`unlock mismatch: ${order.amount} ${order.currency} vs ${order.expectedAmount} ${order.expectedCurrency}`);
      return res.status(400).json({ error: "Payment amount or currency mismatch." });
    }
    chargeResult = { ok: true, provider: "paypal", mode: cfg.environment, reference: order.reference, orderId: order.orderId, transactionId: order.reference, payerEmail: order.payerEmail };
  } else {
    chargeResult = await charge({ method, amount, currency });
    if (!chargeResult.ok) throw new Error("Payment authorization failed.");
    chargeResult.orderId = orderId || chargeResult.reference;
    chargeResult.transactionId = chargeResult.reference;
  }

  // Record payment + unlock (3 edit credits).
  const invoiceNumber = genInvoiceNumber();
  const nowIso = new Date().toISOString();
  const payment = await pb.collection("payments").create({
    amount: amount / 100,
    currency,
    status: "paid",
    provider: chargeResult.provider,
    method,
    reference: chargeResult.reference,
    paypalOrderId: chargeResult.orderId || "",
    transactionId: chargeResult.transactionId || "",
    payerEmail: chargeResult.payerEmail || "",
    verifiedAt: nowIso,
    invoiceNumber,
    description: "PDF unlock — lifetime downloads + 3 AI edits",
    resume: resume.id,
    owner: userId,
  });

  await pb.collection("resumes").update(resume.id, {
    editsRemaining: Math.max(3, resume.editsRemaining || 0),
    isPaid: true, paidAt: nowIso, paymentId: payment.id,
  });

  try {
    await pb.collection("notifications").create({
      title: "PDF unlocked",
      body: `PDF downloads for "${resume.title}" are now unlocked. Invoice ${invoiceNumber}.`,
      read: false,
      owner: userId,
    });
  } catch (err) {
    logger.warn(`notification create failed: ${String(err)}`);
  }

  res.json({ ok: true, invoiceNumber, resumeId: resume.id, mode: chargeResult.mode });
};
