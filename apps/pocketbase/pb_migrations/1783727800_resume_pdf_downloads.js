/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("resumes");
    if (!collection.fields.getByName("pdfDownloads")) {
      collection.fields.add(
        new NumberField({
          name: "pdfDownloads",
          required: false,
          min: 0,
        }),
      );
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("resumes");
    collection.fields.removeByName("pdfDownloads");
    app.save(collection);
  },
);
