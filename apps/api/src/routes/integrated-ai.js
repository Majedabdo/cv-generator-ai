import { Router } from 'express';
import { streamChat } from '../api/ai-provider.js';
import { composeUserText, extractFromFiles } from '../api/file-extract.js';
import { resolvePrompt } from '../constants/prompt-store.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';

const ContentBlockType = Object.freeze({ Text: 'text', Image: 'image' });

const router = Router();

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
	const { message } = req.body;

	if (!message) {
		throw new Error('message is required');
	}

	if (typeof message !== 'string') {
		return res.status(400).json({ error: 'message must be a string' });
	}

	const parsedMessage = JSON.parse(message);

	// Text blocks from the client become the base user text.
	const baseText = parsedMessage
		.filter((b) => b.type === ContentBlockType.Text)
		.map((b) => b.text)
		.join('\n');

	// Any image URLs already present in the message (e.g. from history).
	const inlineImages = parsedMessage
		.filter((b) => b.type === ContentBlockType.Image)
		.map((b) => b.image);

	// Extract text from uploaded CVs / job descriptions and collect images.
	const { images: uploadedImages, documents } = await extractFromFiles(req.files || []);

	const userText = composeUserText(baseText, documents);
	const images = [...inlineImages, ...uploadedImages];

	const sseStream = await streamChat({
		systemPrompt: await resolvePrompt('chat'),
		userText,
		images,
	});

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no');

	sseStream.pipe(res, { end: false });

	sseStream.on('end', () => res.end());
	res.on('close', () => sseStream.destroy());
});

export default router;
