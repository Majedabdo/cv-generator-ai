/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // --- Extend users with profile + referral + loyalty fields ---
    const addUserField = (field) => {
      if (!users.fields.getByName(field.name)) users.fields.add(field);
    };
    addUserField(new TextField({ name: "phone", max: 40 }));
    addUserField(new TextField({ name: "title", max: 160 }));
    addUserField(new TextField({ name: "linkedin", max: 300 }));
    addUserField(new TextField({ name: "portfolio", max: 300 }));
    addUserField(new JSONField({ name: "careerProfile", maxSize: 2000000 }));
    addUserField(new TextField({ name: "referralCode", max: 20 }));
    addUserField(new NumberField({ name: "points", min: 0 }));
    app.save(users);

    if (!users.indexes.find((i) => i.includes("idx_users_referralCode"))) {
      users.indexes.push(
        "CREATE UNIQUE INDEX `idx_users_referralCode` ON `users` (`referralCode`) WHERE `referralCode` != ''",
      );
      app.save(users);
    }

    // --- Extend resumes with edit credits + target job ---
    const resumes = app.findCollectionByNameOrId("resumes");
    if (!resumes.fields.getByName("editsRemaining"))
      resumes.fields.add(new NumberField({ name: "editsRemaining", min: 0 }));
    if (!resumes.fields.getByName("targetJob"))
      resumes.fields.add(new TextField({ name: "targetJob", max: 200 }));
    app.save(resumes);

    // --- Extend payments with gateway method + invoice + resume link ---
    const payments = app.findCollectionByNameOrId("payments");
    if (!payments.fields.getByName("method"))
      payments.fields.add(new TextField({ name: "method", max: 40 }));
    if (!payments.fields.getByName("invoiceNumber"))
      payments.fields.add(new TextField({ name: "invoiceNumber", max: 40 }));
    if (!payments.fields.getByName("description"))
      payments.fields.add(new TextField({ name: "description", max: 300 }));
    if (!payments.fields.getByName("resume"))
      payments.fields.add(
        new RelationField({
          name: "resume",
          maxSelect: 1,
          collectionId: resumes.id,
          cascadeDelete: false,
        }),
      );
    app.save(payments);

    // --- Documents collection (uploaded files, owner-scoped) ---
    try {
      app.findCollectionByNameOrId("documents");
    } catch (_) {
      const documents = new Collection({
        type: "base",
        name: "documents",
        listRule: "@request.auth.id != '' && @request.auth.id = owner",
        viewRule: "@request.auth.id != '' && @request.auth.id = owner",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule: "@request.auth.id != '' && @request.auth.id = owner",
        deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
        fields: [
          { name: "name", type: "text", required: true, max: 200 },
          {
            name: "folder",
            type: "select",
            maxSelect: 1,
            values: ["cv", "certificate", "cover_letter", "image", "other"],
          },
          {
            name: "file",
            type: "file",
            maxSelect: 1,
            maxSize: 15728640,
            mimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "application/pdf",
              "text/plain",
            ],
          },
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(documents);
    }

    // --- Referrals collection ---
    try {
      app.findCollectionByNameOrId("referrals");
    } catch (_) {
      const referrals = new Collection({
        type: "base",
        name: "referrals",
        listRule: "@request.auth.id != '' && @request.auth.id = owner",
        viewRule: "@request.auth.id != '' && @request.auth.id = owner",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "invitedEmail", type: "text", max: 200 },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["pending", "joined", "rewarded"],
          },
          { name: "pointsAwarded", type: "number", min: 0 },
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(referrals);
    }
  },
  (app) => {
    for (const name of ["referrals", "documents"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
  },
);
