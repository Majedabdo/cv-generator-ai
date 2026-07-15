/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const messages = app.findCollectionByNameOrId("_integratedAiMessages");
    if (!messages.fields.getByName("chatId")) {
      messages.fields.add(new TextField({ name: "chatId", max: 60, required: false }));
    }
    app.save(messages);
  },
  (app) => {
    const messages = app.findCollectionByNameOrId("_integratedAiMessages");
    messages.fields.removeByName("chatId");
    app.save(messages);
  }
);
