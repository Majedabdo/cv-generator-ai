/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const addUserField = (field) => {
      if (!users.fields.getByName(field.name)) users.fields.add(field);
    };
    addUserField(new BoolField({ name: "suspended" }));
    addUserField(new DateField({ name: "lastLogin" }));
    addUserField(new TextField({ name: "country", max: 80 }));
    addUserField(new NumberField({ name: "aiRequests", min: 0 }));
    addUserField(new NumberField({ name: "aiCost", min: 0 }));
    addUserField(new NumberField({ name: "visits", min: 0 }));
    app.save(users);

    const ts = () => [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    const ensure = (def) => {
      try {
        return app.findCollectionByNameOrId(def.name);
      } catch (_) {
        const c = new Collection(def);
        app.save(c);
        return c;
      }
    };

    // Coupons — admin managed (server only via superuser)
    ensure({
      type: "base",
      name: "coupons",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
        { name: "code", type: "text", required: true, max: 40 },
        { name: "percentOff", type: "number", min: 0, max: 100 },
        { name: "amountOff", type: "number", min: 0 },
        { name: "active", type: "bool" },
        { name: "uses", type: "number", min: 0 },
        { name: "maxUses", type: "number", min: 0 },
        { name: "expiresAt", type: "date" },
        ...ts(),
      ],
    });

    // Feedback / reviews / NPS
    ensure({
      type: "base",
      name: "feedback",
      listRule: null, viewRule: null,
      createRule: "@request.auth.id != ''",
      updateRule: null, deleteRule: null,
      fields: [
        { name: "type", type: "select", maxSelect: 1, values: ["suggestion", "feature", "review", "nps", "rating"] },
        { name: "rating", type: "number", min: 0, max: 10 },
        { name: "message", type: "text", max: 3000 },
        { name: "authorEmail", type: "text", max: 200 },
        { name: "owner", type: "relation", maxSelect: 1, collectionId: users.id, cascadeDelete: false },
        ...ts(),
      ],
    });

    // Email templates
    const emailTpl = ensure({
      type: "base",
      name: "email_templates",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
        { name: "key", type: "text", required: true, max: 60 },
        { name: "name", type: "text", max: 120 },
        { name: "subject", type: "text", max: 200 },
        { name: "body", type: "editor" },
        ...ts(),
      ],
    });

    // Admin activity / audit log
    ensure({
      type: "base",
      name: "admin_logs",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
        { name: "action", type: "text", max: 200 },
        { name: "actor", type: "text", max: 200 },
        { name: "target", type: "text", max: 200 },
        { name: "ip", type: "text", max: 80 },
        { name: "meta", type: "json", maxSize: 200000 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      ],
    });

    // App settings — single json blob store keyed by name
    const settings = ensure({
      type: "base",
      name: "app_settings",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
        { name: "key", type: "text", required: true, max: 60 },
        { name: "value", type: "json", maxSize: 2000000 },
        ...ts(),
      ],
    });

    // Support tickets: extend with admin fields
    const tickets = app.findCollectionByNameOrId("support_tickets");
    const addT = (field) => { if (!tickets.fields.getByName(field.name)) tickets.fields.add(field); };
    addT(new SelectField({ name: "category", maxSelect: 1, values: ["ticket", "suggestion", "feature", "refund", "bug", "question"] }));
    addT(new TextField({ name: "assignedTo", max: 120 }));
    addT(new TextField({ name: "internalNote", max: 3000 }));
    addT(new TextField({ name: "reply", max: 5000 }));
    app.save(tickets);

    // Seed default email templates + settings (idempotent)
    const seedTpl = (key, name, subject, body) => {
      try {
        app.findFirstRecordByData("email_templates", "key", key);
      } catch (_) {
        const r = new Record(emailTpl);
        r.set("key", key); r.set("name", name); r.set("subject", subject); r.set("body", body);
        app.save(r);
      }
    };
    seedTpl("welcome", "Welcome Email", "Welcome to CVPilot AI", "<p>Your account is ready. Welcome aboard!</p>");
    seedTpl("payment", "Payment Confirmation", "Payment confirmed — Invoice {invoice}", "<p>Thank you for your purchase.</p>");
    seedTpl("reset", "Password Reset", "Reset your password", "<p>Click the link to reset your password.</p>");
    seedTpl("resume_ready", "Resume Ready", "Your resume is ready", "<p>Your ATS-optimized resume is ready to download.</p>");
    seedTpl("invoice", "Invoice", "Your invoice {invoice}", "<p>Please find your invoice attached.</p>");
    seedTpl("support_reply", "Support Reply", "Re: your support request", "<p>Our team has responded to your ticket.</p>");

    const seedSetting = (key, value) => {
      try {
        app.findFirstRecordByData("app_settings", "key", key);
      } catch (_) {
        const r = new Record(settings);
        r.set("key", key); r.set("value", value);
        app.save(r);
      }
    };
    seedSetting("general", {
      companyName: "CVPilot AI", supportEmail: "support@cvpilot.ai",
      currency: "SAR", timezone: "Asia/Riyadh", taxPercent: 15,
      defaultLanguage: "en",
    });
    seedSetting("pricing", { resumePrice: 10, currency: "SAR", proPrice: 29, teamPrice: 99 });
    seedSetting("payments", {
      stripe: true, paypal: true, applePay: true, googlePay: true, mada: true, stcPay: true,
    });
    seedSetting("ai", { provider: "openai", model: "gpt-4o-mini" });
    seedSetting("seo", {
      metaTitle: "CVPilot AI", metaDescription: "AI-powered resume builder",
      robots: "index,follow", ga: "", gtm: "", metaPixel: "", searchConsole: "",
    });
    seedSetting("ads", { enabled: false, freeUsersOnly: true, adsenseId: "", positions: ["header", "sidebar"] });
    seedSetting("backups", { daily: true, weekly: true, monthly: true, lastBackup: "" });

    // Seed a demo admin account for platform management.
    try {
      app.findAuthRecordByEmail("users", "admin@cvpilot.ai");
    } catch (_) {
      const admin = new Record(users);
      admin.setEmail("admin@cvpilot.ai");
      admin.setPassword("cvpilotadmin");
      admin.set("verified", true);
      admin.set("name", "Platform Admin");
      admin.set("role", "admin");
      admin.set("plan", "team");
      app.save(admin);
    }
  },
  (app) => {
    for (const name of ["coupons", "feedback", "email_templates", "admin_logs", "app_settings"]) {
      try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
  },
);
