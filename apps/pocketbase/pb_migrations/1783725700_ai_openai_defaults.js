/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let rec;
    try {
      rec = app.findFirstRecordByFilter("app_settings", 'key = "ai"');
    } catch (_) {
      rec = null;
    }

    const value = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "",
      temperature: 0.7,
      maxTokens: 4096,
    };

    if (rec) {
      rec.set("value", value);
      app.save(rec);
    } else {
      const settings = app.findCollectionByNameOrId("app_settings");
      const r = new Record(settings);
      r.set("key", "ai");
      r.set("value", value);
      app.save(r);
    }
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByFilter("app_settings", 'key = "ai"');
      rec.set("value", { provider: "openai", model: "gpt-4o-mini" });
      app.save(rec);
    } catch (_) {
      // nothing to revert
    }
  },
);
