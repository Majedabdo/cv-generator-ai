import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

// Automatically start the PocketBase process in the background
async function startPocketBase() {
	const isWindows = process.platform === 'win32';
	const pbBinary = isWindows ? 'pocketbase.exe' : 'pocketbase';
	const pbPath = path.resolve(__dirname, '../../pocketbase', pbBinary);

	const pbDataPath = path.resolve(__dirname, '../../pocketbase/pb_data');
	const resetMarkerPath = path.resolve(__dirname, '../../pocketbase/reset_db_marker.txt');
	if (fs.existsSync(resetMarkerPath)) {
		logger.info('Reset database marker found! Killing old pocketbase and deleting old pb_data directory to rebuild...');
		try {
			// Terminate any running pocketbase processes to free ports and locks
			try {
				const { execSync } = await import('child_process');
				if (isWindows) {
					execSync('taskkill /f /im pocketbase.exe');
				} else {
					execSync('pkill -f pocketbase');
				}
				logger.info('Successfully killed existing pocketbase processes.');
			} catch (_) {
				// Ignore if no process is running
			}

			// Small sleep to ensure files are released
			await new Promise((r) => setTimeout(r, 1000));

			if (fs.existsSync(pbDataPath)) {
				fs.rmSync(pbDataPath, { recursive: true, force: true });
				logger.info('Successfully deleted old pb_data directory.');
			}
			fs.unlinkSync(resetMarkerPath);
		} catch (err) {
			logger.error('Failed to reset pb_data directory:', err);
		}
	}

	// Check if PocketBase is already running on port 8090 (important for multi-worker Passenger environments)
	try {
		const check = await fetch('http://127.0.0.1:8090/api/health', { method: 'HEAD' });
		if (check.ok) {
			logger.info('PocketBase is already running on port 8090, skipping spawn.');
			return;
		}
	} catch (_) {
		// Not running, proceed
	}

	logger.info(`Starting PocketBase from: ${pbPath}`);

	// Set executable permissions if on Linux/macOS
	if (!isWindows) {
		try {
			fs.chmodSync(pbPath, '755');
		} catch (err) {
			logger.error('Failed to set pocketbase executable permissions:', err);
		}
	}

	try {
		const pbProcess = spawn(pbPath, ['serve', '--http=127.0.0.1:8090'], {
			cwd: path.resolve(__dirname, '../../pocketbase'),
			stdio: 'ignore',
		});

		pbProcess.on('error', (err) => {
			logger.error('Failed to start PocketBase process:', err);
		});

		pbProcess.on('exit', (code) => {
			logger.warn(`PocketBase process exited with code ${code}`);
			// Auto-restart after 5 seconds if it crashes
			setTimeout(startPocketBase, 5000);
		});
	} catch (spawnError) {
		logger.error('Synchronous PocketBase spawn error:', spawnError);
	}
}

// Start PocketBase process
await startPocketBase();

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet());
app.use(cors({
	origin: process.env.CORS_ORIGIN || false, // deny cors when unset (on purpose)
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'QUERY'],
	allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

// Diagnostics endpoint to test binary execution on Hostinger
app.get('/hcgi/api/diagnose', async (req, res) => {
	const isWindows = process.platform === 'win32';
	const pbBinary = isWindows ? 'pocketbase.exe' : 'pocketbase';
	const pbPath = path.resolve(__dirname, '../../pocketbase', pbBinary);
	
	const diagnostics = {
		platform: process.platform,
		arch: process.arch,
		nodeVersion: process.version,
		pbPathExists: fs.existsSync(pbPath),
		pbPermissions: null,
		spawnTest: null,
		shellTest: null,
		tmpFolderExecuteTest: null,
	};

	if (fs.existsSync(pbPath)) {
		try {
			const stats = fs.statSync(pbPath);
			diagnostics.pbPermissions = stats.mode.toString(8);
		} catch (e) {
			diagnostics.pbPermissions = `Error: ${e.message}`;
		}
	}

	// Try spawning pocketbase with a --version flag (no shell)
	try {
		const result = spawnSync(pbPath, ['--version']);
		if (result.error) {
			diagnostics.spawnTest = `Error: ${result.error.message}`;
		} else {
			diagnostics.spawnTest = (result.stdout || result.stderr || '').toString().trim();
		}
	} catch (e) {
		diagnostics.spawnTest = `Catch Error: ${e.message}`;
	}

	// Try copying to /tmp and running it from there (no shell)
	try {
		const tmpPbPath = '/tmp/pocketbase_diag';
		if (fs.existsSync(pbPath)) {
			fs.copyFileSync(pbPath, tmpPbPath);
			try {
				fs.chmodSync(tmpPbPath, '755');
			} catch (chmodErr) {
				diagnostics.tmpFolderExecuteTest = `Chmod failed: ${chmodErr.message}`;
			}
			const result = spawnSync(tmpPbPath, ['--version']);
			if (result.error) {
				diagnostics.tmpFolderExecuteTest = `Spawn Error: ${result.error.message}`;
			} else {
				diagnostics.tmpFolderExecuteTest = (result.stdout || result.stderr || '').toString().trim();
			}
			fs.unlinkSync(tmpPbPath);
		} else {
			diagnostics.tmpFolderExecuteTest = 'PocketBase binary path does not exist';
		}
	} catch (e) {
		diagnostics.tmpFolderExecuteTest = `Catch Error: ${e.message}`;
	}

	res.json(diagnostics);
});

// Proxy PocketBase requests to localhost:8090
app.use('/hcgi/platform', async (req, res) => {
	const targetUrl = `http://localhost:8090${req.originalUrl.replace(/^\/hcgi\/platform/, '')}`;
	try {
		const headers = { ...req.headers };
		delete headers.host;

		const fetchOptions = {
			method: req.method,
			headers: headers,
		};

		if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
			fetchOptions.body = JSON.stringify(req.body);
		}

		const response = await fetch(targetUrl, fetchOptions);

		res.status(response.status);
		response.headers.forEach((value, key) => {
			res.setHeader(key, value);
		});

		const data = await response.arrayBuffer();
		res.send(Buffer.from(data));
	} catch (error) {
		logger.error('PocketBase proxy failed:', error);
		res.status(500).json({ error: 'PocketBase connection failed' });
	}
});

// Serve static files from the React build folder in production
const distPath = path.join(__dirname, '../../../dist/apps/web');
app.use(express.static(distPath));

app.use('/', routes());
app.use('/hcgi/api', routes());

// Fallback to React app for all other routes
app.get('/*splat', (req, res, next) => {
	if (req.path.startsWith('/hcgi/')) {
		return next();
	}
	res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

server.on('error', (err) => {
	logger.error(`FATAL: API Server failed to listen on port ${port}:`, err);
	process.exit(1);
});

export default app;
