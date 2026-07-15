/// <reference path="../pb_data/types.d.ts" />

// Branded password-reset email.
onMailerRecordPasswordResetSend((e) => {
  const appUrl = $app.settings().meta.appUrl;
  const link = `${appUrl}/_/#/auth/confirm-password-reset/${e.meta.token}`;
  e.message.from.name = "CVPilot AI";
  e.message.subject = "Reset your CVPilot AI password";
  e.message.html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
      <h1 style="color:#7c3aed">Reset your password</h1>
      <p>We received a request to reset your CVPilot AI password. Click below to set a new one (link valid 30 minutes).</p>
      <p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a></p>
      <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
  e.next();
}, "users");

// Resume-ready email — fires when a resume is saved as complete.
onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  if (record.getString("status") === "complete") {
    try {
      $app.expandRecord(record, ["owner"], null);
      const owner = record.expandedOne("owner");
      const email = owner ? owner.getString("email") : "";
      if (email) {
        const title = record.getString("title") || "Your resume";
        const score = record.get("atsScore");
        const message = new MailerMessage({
          from: { name: "CVPilot AI" },
          to: [{ address: email }],
          subject: "Your resume is ready to download",
          html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
              <h1 style="color:#7c3aed">Your resume is ready</h1>
              <p><strong>${title}</strong> has been generated and saved to your dashboard${
                score ? ` with an ATS score of <strong>${score}%</strong>` : ""
              }.</p>
              <p>You can download it as PDF, DOCX or TXT and keep refining it with AI anytime.</p>
              <p>— The CVPilot AI team</p>
            </div>`,
        });
        $app.newMailClient().send(message);
      }
    } catch (err) {
      $app.logger().error("resume ready email failed", "err", String(err));
    }
  }
  e.next();
}, "resumes");
