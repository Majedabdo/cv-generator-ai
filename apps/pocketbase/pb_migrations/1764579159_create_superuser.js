/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)
    
    record.set("email", $os.getenv("PB_SUPERUSER_EMAIL") || "admin@cvpilot.ai")
    record.set("password", $os.getenv("PB_SUPERUSER_PASSWORD") || "Admin123456")
    
    app.save(record)
})
