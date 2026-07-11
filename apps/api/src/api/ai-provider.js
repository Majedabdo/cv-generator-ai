import process from 'node:process';
import { PassThrough } from 'node:stream';
import logger from '../utils/logger.js';

/**
 * OpenAI-only AI gateway for CVPilot.
 *
 * Every AI feature in the application (chat, resume generation, quality
 * review, ATS analysis, CV/JD analysis, cover letters, scoring, etc.) routes
 * through this single module. It talks EXCLUSIVELY to the official OpenAI API
 * (https://api.openai.com) using ONE consistent model for the whole app.
 *
 * There is NO provider switching and NO fallback to any other provider
 * (no Hostinger Integrated AI, no Claude, no Gemini). All configuration comes
 * from environment variables in apps/api/.env:
 *   OPENAI_API_KEY      — the user's official OpenAI API key
 *   OPENAI_MODEL        — the single model for the entire app (default gpt-4o)
 *   OPENAI_TEMPERATURE  — sampling temperature (default 0.7)
 *   OPENAI_MAX_TOKENS   — max completion tokens (default 4096)
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 2;

function num(v, fallback) {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve the OpenAI configuration from environment variables only.
 * @returns {{provider: 'openai', model: string, apiKey: string, temperature: number, maxTokens: number}}
 */
export function getAiConfig() {
	return {
		provider: 'openai',
		model: process.env.OPENAI_MODEL || 'gpt-4o',
		apiKey: process.env.OPENAI_API_KEY || '',
		temperature: num(process.env.OPENAI_TEMPERATURE, 0.7),
		maxTokens: num(process.env.OPENAI_MAX_TOKENS, 4096),
	};
}

function sse(type, content) {
	return `data: ${JSON.stringify({ type, data: { content } })}\n\n`;
}

function openAiUserContent(userText, images) {
	const content = [{ type: 'text', text: userText }];
	for (const url of images) {
		content.push({ type: 'image_url', image_url: { url } });
	}
	return content;
}

function requireKey(cfg) {
	if (!cfg.apiKey) {
		throw new Error('OPENAI_API_KEY is not set in apps/api/.env');
	}
}

/**
 * fetch with simple retry for transient network / 429 / 5xx errors.
 * @param {object} payload
 * @param {string} apiKey
 * @returns {Promise<Response>}
 */
async function openAiFetch(payload, apiKey) {
	let lastErr;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const response = await fetch(OPENAI_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify(payload),
			});

			// Retry only on rate limit / server errors.
			if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
				logger.info(`OpenAI transient ${response.status}, retry ${attempt + 1}/${MAX_RETRIES}`);
				await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
				continue;
			}
			return response;
		} catch (err) {
			lastErr = err;
			if (attempt < MAX_RETRIES) {
				logger.info(`OpenAI network error, retry ${attempt + 1}/${MAX_RETRIES}: ${err.message}`);
				await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
				continue;
			}
		}
	}
	throw lastErr || new Error('OpenAI request failed after retries');
}

/**
 * Streams a chat completion as an SSE Node stream compatible with the
 * frontend hook (content / error / completed events). OpenAI only.
 *
 * @param {{ systemPrompt: string, userText: string, images?: string[] }} params
 * @returns {Promise<import('node:stream').PassThrough>}
 */
export async function streamChat({ systemPrompt, userText, images = [] }) {
	const cfg = getAiConfig();
	const pass = new PassThrough();

	(async () => {
		try {
			requireKey(cfg);

			const response = await openAiFetch({
				model: cfg.model,
				temperature: cfg.temperature,
				max_tokens: cfg.maxTokens,
				stream: true,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: openAiUserContent(userText, images) },
				],
			}, cfg.apiKey);

			if (!response.ok || !response.body) {
				const body = await response.text().catch(() => '');
				throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} ${body}`);
			}

			const textStream = response.body.pipeThrough(new TextDecoderStream());
			let buffer = '';

			for await (const chunk of textStream) {
				buffer += chunk;
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith('data:')) {
						continue;
					}
					const data = trimmed.slice(5).trim();
					if (data === '[DONE]') {
						return;
					}
					let json;
					try {
						json = JSON.parse(data);
					} catch {
						continue;
					}
					const delta = json.choices?.[0]?.delta?.content;
					if (delta) {
						pass.write(sse('content', delta));
					}
				}
			}
		} catch (err) {
			logger.error('streamChat failed', err);
			pass.write(sse('error', err.message || 'AI generation failed'));
		} finally {
			pass.end(sse('completed', '[COMPLETED]'));
		}
	})();

	return pass;
}

/**
 * One-shot, non-streaming text generation used for resume / quality / ATS
 * generation. OpenAI only.
 *
 * @param {{ systemPrompt: string, userText: string, images?: string[] }} params
 * @returns {Promise<string>}
 */
export async function generateText({ systemPrompt, userText, images = [] }) {
	const cfg = getAiConfig();
	requireKey(cfg);

	const response = await openAiFetch({
		model: cfg.model,
		temperature: cfg.temperature,
		max_tokens: cfg.maxTokens,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: openAiUserContent(userText, images) },
		],
	}, cfg.apiKey);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} ${body}`);
	}

	const json = await response.json();
	return json.choices?.[0]?.message?.content || '';
}
