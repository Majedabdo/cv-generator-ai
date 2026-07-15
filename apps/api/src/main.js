import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

// Automatically start the PocketBase process in the background
function startPocketBase() {
	const isWindows = process.platform === 'win32';
	const pbBinary = isWindows ? 'pocketbase.exe' : 'pocketbase';
	const pbPath = path.resolve(__dirname, '../../pocketbase', pbBinary);

	logger.info(`Starting PocketBase from: ${pbPath}`);

	// Set executable permissions if on Linux/macOS
	if (!isWindows) {
		try {
			fs.chmodSync(pbPath, '755');
		} catch (err) {
			logger.error('Failed to set pocketbase executable permissions:', err);
		}
	}

	const pbProcess = spawn(pbPath, ['serve', '--http=127.0.0.1:8090'], {
		cwd: path.resolve(__dirname, '../../pocketbase'),
		stdio: 'inherit',
	});

	pbProcess.on('error', (err) => {
		logger.error('Failed to start PocketBase process:', err);
	});

	pbProcess.on('exit', (code) => {
		logger.warn(`PocketBase process exited with code ${code}`);
		// Auto-restart after 5 seconds if it crashes
		setTimeout(startPocketBase, 5000);
	});
}

// Start PocketBase process
startPocketBase();

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
app.get('*', (req, res, next) => {
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

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;
