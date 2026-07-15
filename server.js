// Root entry file for Node.js hosting environments (like Passenger on Hostinger)
(async () => {
    try {
        console.log("[INFO] Launching API Server via dynamic import...");
        await import('./apps/api/src/main.js');
    } catch (err) {
        console.error("[FATAL] Failed to start API Server:", err);
        process.exit(1);
    }
})();
