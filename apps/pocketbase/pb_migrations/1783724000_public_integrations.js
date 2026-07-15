/// <reference path="../pb_data/types.d.ts" />

// A dedicated PUBLIC collection holding only non-secret, client-side
// integration IDs (GA4, GTM, Clarity, AdSense publisher id). These are
// exposed in page HTML anyway, so public read is safe. Kept separate from
// app_settings (which may hold secret keys and stays superuser-only).
migrate(
  (app) => {
    let col;
    try {
      col = app.findCollectionByNameOrId("public_integrations");
    } catch (_) {
      col = new Collection({
        type: "base",
        name: "public_integrations",
        listRule: "",
        viewRule: "",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "key", type: "text", required: true, max: 60 },
          { name: "value", type: "json", maxSize: 200000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(col);
    }

    // Seed an empty "integrations" row admins can later fill in.
    try {
      app.findFirstRecordByFilter("public_integrations", 'key="integrations"');
    } catch (_) {
      const rec = new Record(col);
      rec.set("key", "integrations");
      rec.set("value", { ga4: "", gtm: "", clarity: "", adsense: "" });
      app.save(rec);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("public_integrations"));
    } catch (_) {}
  },
);
