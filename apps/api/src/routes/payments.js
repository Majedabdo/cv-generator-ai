import Pocketbase from "pocketbase";
import pb from "../utils/pocketbaseClient.js";
import { charge } from "../api/payment-gateways.js";
import { loadConfig, verifyOrder } from "../api/paypal-config.js";
import logger from "../utils/logger.js";

const PB_HOST = "http://localhost:8090";

function genPassword() {
  return `Cv${Math.random().toString(36).slice(2, 10)}${Math.floor(
    1000 + Math.random() * 9000,
  )}!`;
}

function genReferralCode(name) {
  const base = (name || "cv").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "CV";
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function genInvoiceNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `CV-${stamp}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default async (req, res) => {
  const {
    email,
    name,
    amount = 269,
    currency = "USD",
    contentEn,
    contentAr,
    template,
    referralCode,
    orderId,
  } = req.body || {};

  // PayPal is the only supported payment method.
  const method = "paypal";

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(422).json({ error: "A valid email is required." });
  }
  const bundle = contentEn || contentAr;
  if (!bundle || !bundle.resume) {
    return res.status(422).json({ error: "A generated resume is required before payment." });
  }

  // 1) Authorize the payment through PayPal.
  // When PayPal is fully configured + verified, require a real captured order id.
  const cfg = await loadConfig();
  let chargeResult;
  const isSandboxOrder = !orderId || String(orderId).startsWith("SANDBOX");
  if (cfg.configured && cfg.verified && !isSandboxOrder) {
    let order;
    try {
      order = await verifyOrder(orderId);
    } catch (err) {
      return res.status(400).json({ error: `PayPal verification failed: ${String(err.message || err)}` });
    }
    if (!order.ok) {
      return res.status(400).json({ error: `Payment not completed (status: ${order.status}).` });
    }
    if (!order.amountMatch || !order.currencyMatch) {
      logger.error(`payment mismatch: got ${order.amount} ${order.currency}, expected ${order.expectedAmount} ${order.expectedCurrency}`);
      return res.status(400).json({ error: "Payment amount or currency mismatch. Please contact support." });
    }
    chargeResult = {
      ok: true, provider: "paypal", mode: cfg.environment,
      reference: order.reference, orderId: order.orderId,
      transactionId: order.reference, payerEmail: order.payerEmail,
      amount: order.amount, currency: order.currency,
    };
  } else {
    // Sandbox fallback so the flow works before the wizard is verified.
    chargeResult = await charge({ method, amount, currency });
    if (!chargeResult.ok) {
      throw new Error("Payment authorization failed.");
    }
    chargeResult.orderId = orderId || chargeResult.reference;
    chargeResult.transactionId = chargeResult.reference;
    chargeResult.payerEmail = email;
  }

  // 2) Find or create the user account automatically.
  let user;
  let isNewUser = false;
  let tempPassword = null;
  try {
    user = await pb
      .collection("users")
      .getFirstListItem(`email="${email.replace(/"/g, '')}"`);
  } catch (_) {
    user = null;
  }

  if (!user) {
    isNewUser = true;
    tempPassword = genPassword();
    user = await pb.collection("users").create({
      email,
      password: tempPassword,
      passwordConfirm: tempPassword,
      name: name || bundle.resume.fullName || email.split("@")[0],
      plan: "pro",
      role: "user",
      points: 50,
      referralCode: genReferralCode(name || bundle.resume.fullName),
      title: bundle.resume.targetTitle || "",
      linkedin: bundle.resume.contact?.linkedin || "",
      portfolio: bundle.resume.contact?.portfolio || "",
    });
  }

  // 3) Save the resume permanently with 3 edit credits.
  const resume = await pb.collection("resumes").create({
    title: bundle.resume.targetTitle || bundle.resume.fullName || "My Resume",
    content: bundle,
    content_en: contentEn || null,
    content_ar: contentAr || null,
    template: template || "",
    targetJob: bundle.resume.targetTitle || "",
    atsScore: bundle.scores?.overall || 0,
    status: "complete",
    editsRemaining: 3,
    owner: user.id,
  });

  // 4) Record the payment + invoice.
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
    payerEmail: chargeResult.payerEmail || email,
    verifiedAt: nowIso,
    invoiceNumber,
    description: "Resume unlock — lifetime downloads + 3 AI edits",
    resume: resume.id,
    owner: user.id,
  });

  // Mark the resume as paid + unlocked.
  try {
    await pb.collection("resumes").update(resume.id, {
      isPaid: true, paidAt: nowIso, paymentId: payment.id,
    });
  } catch (err) {
    logger.warn(`resume paid flag update failed: ${String(err)}`);
  }

  // 5) Welcome notification.
  try {
    await pb.collection("notifications").create({
      title: "Payment successful",
      body: `Your resume "${resume.title}" is unlocked. Invoice ${invoiceNumber}.`,
      read: false,
      owner: user.id,
    });
  } catch (err) {
    logger.warn(`notification create failed: ${String(err)}`);
  }

  // 6) Referral reward — award the referrer loyalty points.
  if (referralCode && typeof referralCode === "string") {
    try {
      const referrer = await pb
        .collection("users")
        .getFirstListItem(`referralCode="${referralCode.replace(/"/g, '')}"`);
      if (referrer && referrer.id !== user.id) {
        await pb.collection("referrals").create({
          invitedEmail: email,
          status: "rewarded",
          pointsAwarded: 100,
          owner: referrer.id,
        });
        await pb
          .collection("users")
          .update(referrer.id, { points: (referrer.points || 0) + 100 });
      }
    } catch (err) {
      logger.warn(`referral reward skipped: ${String(err)}`);
    }
  }

  // 7) For new accounts, sign them in and send a password-setup link.
  let account = null;
  if (isNewUser && tempPassword) {
    try {
      const userPb = new Pocketbase(PB_HOST);
      userPb.autoCancellation(false);
      const authData = await userPb
        .collection("users")
        .authWithPassword(email, tempPassword);
      account = { token: authData.token, record: authData.record };
    } catch (err) {
      logger.warn(`auto-login failed: ${String(err)}`);
    }
    try {
      await pb.collection("users").requestPasswordReset(email);
    } catch (err) {
      logger.warn(`password setup link failed: ${String(err)}`);
    }
  }

  res.json({
    ok: true,
    isNewUser,
    invoiceNumber,
    resumeId: resume.id,
    mode: chargeResult.mode,
    account,
  });
};
