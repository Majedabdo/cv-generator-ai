import { Router } from 'express';
import { buildMessages, streamCompletion } from '../services/openai-service.js';
import { composeUserText, extractFromFiles } from '../api/file-extract.js';
import { resolvePrompt } from '../constants/prompt-store.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';

const ContentBlockType = Object.freeze({ Text: 'text', Image: 'image' });

const router = Router();

/**
 * POST /chat-v2/stream
 *
 * Stateful, ChatGPT-style chat backed ONLY by the OpenAI Chat Completions API.
 * The client sends the full conversation `history` (proper role/content
 * objects) plus the current `message`. We build [system, ...history, current]
 * and stream OpenAI's reply back over SSE. Documents (CV / job description) are
 * extracted verbatim and appended to the current user message — no preprocessing.
 *
 * Body (multipart form):
 *   message  — JSON string: [{ type:'text', text }, { type:'image', image }]
 *   history  — JSON string: [{ role, content, images? }, ...]
 *   flow     — optional: 'create' | 'optimize'
 *   images   — uploaded files (CV/JD/images)
 */
router.post('/stream', integratedAiRateLimit, uploadFiles({
	allowedMimeTypes: [
		'image/jpeg',
		'image/png',
		'image/webp',
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/msword',
		'text/plain',
	],
	fieldName: 'images',
}), async (req, res) => {
	const { message, history, flow } = req.body;

	if (!message || typeof message !== 'string') {
		return res.status(422).json({ error: 'message is required (JSON string of content blocks)' });
	}

	let parsedMessage;
	let parsedHistory = [];
	try {
		parsedMessage = JSON.parse(message);
		if (history) {
			parsedHistory = JSON.parse(history);
		}
	} catch {
		return res.status(422).json({ error: 'message/history must be valid JSON' });
	}

	const baseText = parsedMessage
		.filter((b) => b.type === ContentBlockType.Text)
		.map((b) => b.text)
		.join('\n');

	const inlineImages = parsedMessage
		.filter((b) => b.type === ContentBlockType.Image)
		.map((b) => b.image);

	// Extract uploaded documents/images VERBATIM (no summarize / no rewrite).
	const { images: uploadedImages, documents } = await extractFromFiles(req.files || []);

	const userText = composeUserText(baseText, documents);
	const images = [...inlineImages, ...uploadedImages];

	let systemPrompt = await resolvePrompt('chat');
	if (flow === 'optimize') {
		systemPrompt += '\n\n# ACTIVE FLOW: OPTIMIZE EXISTING RESUME\nThe user is optimizing an EXISTING resume. Preserve every factual detail (employers, dates, titles, education, metrics) exactly. Never invent or embellish. Improve wording, ATS keyword alignment and structure only. Rewrite content ONLY if the user explicitly asks.';
	} else if (flow === 'create') {
		systemPrompt += '\n\n# ACTIVE FLOW: CREATE NEW RESUME\nThe user is creating a new resume from scratch. Use only information they explicitly provide. Ask for genuinely missing essentials; never fabricate experience, companies, dates or achievements.';
	}

	const messages = buildMessages({
		systemPrompt,
		history: Array.isArray(parsedHistory) ? parsedHistory : [],
		userText,
		images,
	});

	const sseStream = streamCompletion({ messages });

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no');

	sseStream.pipe(res, { end: false });
	sseStream.on('end', () => res.end());
	res.on('close', () => sseStream.destroy());
});

export default router;
