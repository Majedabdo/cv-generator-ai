import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import logger from '../utils/logger.js';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Turns uploaded files into AI-ready inputs:
 *  - images  → base64 data URLs (for OpenAI vision)
 *  - PDF     → extracted plain text (pdf-parse)
 *  - DOCX    → extracted plain text (mammoth)
 *  - TXT     → decoded text
 *
 * @param {Array<{ buffer: Buffer, mimetype: string, originalname: string }>} files
 * @returns {Promise<{ images: string[], documents: Array<{ name: string, text: string }> }>}
 */
export async function extractFromFiles(files = []) {
	const images = [];
	const documents = [];

	for (const file of files) {
		const name = file.originalname || 'file';
		const mime = file.mimetype || '';
		const lower = name.toLowerCase();

		try {
			if (IMAGE_MIME.has(mime)) {
				images.push(`data:${mime};base64,${file.buffer.toString('base64')}`);
				continue;
			}

			if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
				const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
				try {
					const parsed = await parser.getText();
					documents.push({ name, text: (parsed.text || '').trim() });
				} finally {
					await parser.destroy().catch(() => {});
				}
				continue;
			}

			if (mime === DOCX_MIME || lower.endsWith('.docx')) {
				const result = await mammoth.extractRawText({ buffer: file.buffer });
				documents.push({ name, text: (result.value || '').trim() });
				continue;
			}

			if (mime.startsWith('text/') || lower.endsWith('.txt')) {
				documents.push({ name, text: file.buffer.toString('utf-8').trim() });
				continue;
			}

			logger.warn(`Unsupported upload type skipped: ${name} (${mime})`);
		} catch (err) {
			logger.error(`Failed to extract text from ${name}`, err);
			documents.push({ name, text: '' });
		}
	}

	return { images, documents };
}

/**
 * Merges extracted document text into a single user message, capped so we
 * never blow past model context on huge PDFs.
 *
 * @param {string} baseText
 * @param {Array<{ name: string, text: string }>} documents
 * @returns {string}
 */
export function composeUserText(baseText, documents = []) {
	const parts = [];
	if (baseText) {
		parts.push(baseText);
	}
	for (const doc of documents) {
		if (!doc.text) {
			continue;
		}
		const clipped = doc.text.slice(0, 20000);
		parts.push(`\n\n[ATTACHED DOCUMENT: ${doc.name}]\n${clipped}`);
	}
	return parts.join('');
}
