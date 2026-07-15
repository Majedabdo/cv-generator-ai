// Root entry file for Node.js hosting environments (like Passenger on Hostinger)
const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'startup.log');
const browserLogDir = path.resolve(__dirname, 'dist/apps/web');
const browserLogPath = path.join(browserLogDir, 'startup.log');

function logMsg(msg) {
    try {
        const message = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(logPath, message);
        console.log(message);
        
        try {
            if (!fs.existsSync(browserLogDir)) {
                fs.mkdirSync(browserLogDir, { recursive: true });
            }
            fs.appendFileSync(browserLogPath, message);
        } catch (_) {
            // Ignore
        }
    } catch (e) {
        console.error('Failed to write log:', e);
    }
}

// Initialize startup log
try {
    fs.writeFileSync(logPath, `[${new Date().toISOString()}] Server process starting...\n`);
    if (!fs.existsSync(browserLogDir)) {
        fs.mkdirSync(browserLogDir, { recursive: true });
    }
    fs.writeFileSync(browserLogPath, `[${new Date().toISOString()}] Server process starting...\n`);
} catch (_) {
    // Ignore
}

process.on('uncaughtException', (error) => {
    logMsg(`CRASH (uncaughtException): ${error?.stack || error}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logMsg(`CRASH (unhandledRejection): ${reason?.stack || reason}`);
    process.exit(1);
});

logMsg('Crash logger and process handlers initialized.');

// Launch the ES module API server dynamically
(async () => {
    try {
        logMsg("Launching API Server via dynamic import...");
        await import('./apps/api/src/main.js');
        logMsg("API Server import completed successfully.");
    } catch (err) {
        logMsg(`FATAL API Server Launch Error: ${err?.stack || err}`);
        process.exit(1);
    }
})();
