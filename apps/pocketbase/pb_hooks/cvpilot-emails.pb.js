/// <reference path="../pb_data/types.d.ts" />

// Welcome email when a new user account is created.
onRecordAfterCreateSuccess((e) => {
  const email = e.record.getString("email");
  if (email) {
    const message = new MailerMessage({
      from: { name: "CVPilot AI" },
      to: [{ address: email }],
      subject: "Welcome to CVPilot AI",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
          <h1 style="color:#7c3aed">Welcome to CVPilot AI</h1>
          <p>Your account is ready. Your professional resume has been saved and unlocked.</p>
          <p>You can now download it anytime as PDF, DOCX or TXT, edit it with AI, and track everything from your dashboard.</p>
          <p style="color:#6b7280;font-size:13px">A password-setup link is on its way in a separate email so you can secure your account.</p>
          <p>— The CVPilot AI team</p>
        </div>`,
    });
    try {
      $app.newMailClient().send(message);
    } catch (err) {
      $app.logger().error("welcome email failed", "err", String(err));
    }
  }
  e.next();
}, "users");

// Payment confirmation + invoice email.
onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  $app.expandRecord(record, ["owner"], null);
  const owner = record.expandedOne("owner");
  const email = owner ? owner.getString("email") : "";
  if (email) {
    const invoice = record.getString("invoiceNumber");
    const amount = record.get("amount");
    const currency = record.getString("currency");
    const message = new MailerMessage({
      from: { name: "CVPilot AI" },
      to: [{ address: email }],
      subject: `Payment confirmed — Invoice ${invoice}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
          <h1 style="color:#7c3aed">Payment successful</h1>
          <p>Thank you for your purchase. Your resume is now unlocked with lifetime downloads and 3 AI edits.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6b7280">Invoice</td><td style="text-align:right;font-weight:600">${invoice}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Amount</td><td style="text-align:right;font-weight:600">${amount} ${currency}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Status</td><td style="text-align:right;font-weight:600;color:#16a34a">Paid</td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px">This email is your receipt. You can also download the invoice from your dashboard.</p>
        </div>`,
    });
    try {
      $app.newMailClient().send(message);
    } catch (err) {
      $app.logger().error("payment email failed", "err", String(err));
    }
  }
  e.next();
}, "payments");
