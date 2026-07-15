/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Extend users with SaaS profile fields
    if (!users.fields.getByName("plan")) {
      users.fields.add(
        new SelectField({
          name: "plan",
          maxSelect: 1,
          values: ["free", "pro", "team"],
        }),
      );
    }
    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          maxSelect: 1,
          values: ["user", "admin"],
        }),
      );
    }
    if (!users.fields.getByName("locale")) {
      users.fields.add(
        new SelectField({ name: "locale", maxSelect: 1, values: ["en", "ar"] }),
      );
    }
    app.save(users);

    const ownerField = (collectionId) => ({
      name: "owner",
      type: "relation",
      required: true,
      maxSelect: 1,
      collectionId,
      cascadeDelete: true,
    });
    const ts = () => [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];
    const ownerRules = {
      listRule: "@request.auth.id != '' && @request.auth.id = owner",
      viewRule: "@request.auth.id != '' && @request.auth.id = owner",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && @request.auth.id = owner",
      deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
    };

    const make = (def) => {
      try {
        return app.findCollectionByNameOrId(def.name);
      } catch (_) {
        const c = new Collection(def);
        app.save(c);
        return c;
      }
    };

    // Templates — public read
    const templates = make({
      type: "base",
      name: "templates",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, max: 120 },
        { name: "slug", type: "text", max: 120 },
        { name: "category", type: "text", max: 80 },
        { name: "description", type: "text", max: 500 },
        { name: "preview", type: "text", max: 500 },
        { name: "premium", type: "bool" },
        ...ts(),
      ],
    });

    // Resumes
    const resumes = make({
      type: "base",
      name: "resumes",
      ...ownerRules,
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "content", type: "json", maxSize: 2000000 },
        { name: "template", type: "text", max: 120 },
        { name: "atsScore", type: "number", min: 0, max: 100 },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["draft", "complete"],
        },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Resume versions
    make({
      type: "base",
      name: "resume_versions",
      ...ownerRules,
      fields: [
        {
          name: "resume",
          type: "relation",
          maxSelect: 1,
          collectionId: resumes.id,
          cascadeDelete: true,
        },
        { name: "label", type: "text", max: 120 },
        { name: "content", type: "json", maxSize: 2000000 },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Cover letters
    make({
      type: "base",
      name: "cover_letters",
      ...ownerRules,
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "body", type: "editor" },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Job descriptions
    make({
      type: "base",
      name: "job_descriptions",
      ...ownerRules,
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "company", type: "text", max: 200 },
        { name: "content", type: "text", max: 20000 },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Payments
    make({
      type: "base",
      name: "payments",
      listRule: "@request.auth.id != '' && @request.auth.id = owner",
      viewRule: "@request.auth.id != '' && @request.auth.id = owner",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "amount", type: "number", min: 0 },
        { name: "currency", type: "text", max: 8 },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["pending", "paid", "failed", "refunded"],
        },
        { name: "provider", type: "text", max: 60 },
        { name: "reference", type: "text", max: 200 },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Support tickets
    make({
      type: "base",
      name: "support_tickets",
      ...ownerRules,
      fields: [
        { name: "subject", type: "text", required: true, max: 200 },
        { name: "message", type: "text", max: 5000 },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["open", "pending", "closed"],
        },
        {
          name: "priority",
          type: "select",
          maxSelect: 1,
          values: ["low", "normal", "high"],
        },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Notifications
    make({
      type: "base",
      name: "notifications",
      ...ownerRules,
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "body", type: "text", max: 1000 },
        { name: "read", type: "bool" },
        ownerField(users.id),
        ...ts(),
      ],
    });

    // Blog — public read
    make({
      type: "base",
      name: "blog_posts",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "slug", type: "text", max: 200 },
        { name: "excerpt", type: "text", max: 500 },
        { name: "body", type: "editor" },
        { name: "cover", type: "text", max: 500 },
        { name: "author", type: "text", max: 120 },
        { name: "category", type: "text", max: 80 },
        { name: "published", type: "bool" },
        ...ts(),
      ],
    });
  },
  (app) => {
    for (const name of [
      "resume_versions",
      "payments",
      "cover_letters",
      "job_descriptions",
      "support_tickets",
      "notifications",
      "blog_posts",
      "resumes",
      "templates",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
  },
);
