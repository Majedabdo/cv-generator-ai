import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
