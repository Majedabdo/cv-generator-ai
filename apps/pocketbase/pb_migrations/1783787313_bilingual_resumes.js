/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("resumes");
    if (!collection.fields.getByName("content_en")) {
      collection.fields.add(
        new JSONField({ name: "content_en", required: false, maxSize: 2000000 }),
      );
    }
    if (!collection.fields.getByName("content_ar")) {
      collection.fields.add(
        new JSONField({ name: "content_ar", required: false, maxSize: 2000000 }),
      );
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("resumes");
    collection.fields.removeByName("content_en");
    collection.fields.removeByName("content_ar");
    app.save(collection);
  },
);
