/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const payments = app.findCollectionByNameOrId("payments");
    if (!payments.fields.getByName("paypalOrderId")) {
      payments.fields.add(new TextField({ name: "paypalOrderId", max: 60, required: false }));
    }
    if (!payments.fields.getByName("transactionId")) {
      payments.fields.add(new TextField({ name: "transactionId", max: 60, required: false }));
    }
    if (!payments.fields.getByName("payerEmail")) {
      payments.fields.add(new TextField({ name: "payerEmail", max: 200, required: false }));
    }
    if (!payments.fields.getByName("verifiedAt")) {
      payments.fields.add(new DateField({ name: "verifiedAt", required: false }));
    }
    app.save(payments);

    const resumes = app.findCollectionByNameOrId("resumes");
    if (!resumes.fields.getByName("isPaid")) {
      resumes.fields.add(new BoolField({ name: "isPaid", required: false }));
    }
    if (!resumes.fields.getByName("paidAt")) {
      resumes.fields.add(new DateField({ name: "paidAt", required: false }));
    }
    if (!resumes.fields.getByName("paymentId")) {
      resumes.fields.add(new TextField({ name: "paymentId", max: 60, required: false }));
    }
    app.save(resumes);
  },
  (app) => {
    const payments = app.findCollectionByNameOrId("payments");
    ["paypalOrderId", "transactionId", "payerEmail", "verifiedAt"].forEach((f) => payments.fields.removeByName(f));
    app.save(payments);
    const resumes = app.findCollectionByNameOrId("resumes");
    ["isPaid", "paidAt", "paymentId"].forEach((f) => resumes.fields.removeByName(f));
    app.save(resumes);
  },
);
