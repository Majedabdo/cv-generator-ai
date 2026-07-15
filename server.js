// Root entry file for Node.js hosting environments (like Passenger on Hostinger)
const fs = require('fs');
const path = require('path');

const crashLogPath = path.resolve(__dirname, 'dist/apps/web/crash.txt');

function logCrash(error) {
    try {
        const message = `[${new Date().toISOString()}] CRASH: ${error?.stack || error}\n`;
        fs.appendFileSync(crashLogPath, message);
        console.error(message);
    } catch (e) {
        console.error('Failed to write crash log:', e);
    }
}

process.on('uncaughtException', (error) => {
    logCrash(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logCrash(reason);
    process.exit(1);
});

console.log('[INFO] Crash logger initialized. Logs: ' + crashLogPath);

// Launch the ES module API server dynamically
(async () => {
    try {
        console.log("[INFO] Launching API Server via dynamic import...");
        await import('./apps/api/src/main.js');
    } catch (err) {
        logCrash(err);
        process.exit(1);
    }
})();
