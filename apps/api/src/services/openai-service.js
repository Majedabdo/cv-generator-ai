import process from 'node:process';
import { PassThrough } from 'node:stream';
import logger from '../utils/logger.js';

/**
 * openai-service.js — the SINGLE place the whole app talks to OpenAI.
 *
 * Uses ONLY the official OpenAI Chat Completions API:
 *   POST https://api.openai.com/v1/chat/completions
 *
 * There is NO Hostinger Integrated AI, no provider switching, no fallback.
 * Every request is built as: [ system prompt, ...full conversation history,
 * current user message ] and sent verbatim — no preprocessing, no rewriting,
 * no summarizing of documents or user text.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;

function num(v, fallback) {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

/** Resolve OpenAI config from environment variables only. */
export function getOpenAiConfig() {
	return {
		endpoint: OPENAI_URL,
		model: process.env.OPENAI_MODEL || 'gpt-4o',
		apiKey: process.env.OPENAI_API_KEY || '',
		temperature: num(process.env.OPENAI_TEMPERATURE, 0.7),
		maxTokens: num(process.env.OPENAI_MAX_TOKENS, 4096),
	};
}

function requireKey(cfg) {
	if (!cfg.apiKey) {
		throw new Error('OPENAI_API_KEY is not set in apps/api/.env');
	}
}

function sse(type, content) {
	return `data: ${JSON.stringify({ type, data: { content } })}\n\n`;
}

/**
 * Build an OpenAI messages array from a system prompt + conversation history +
 * the current user turn. History roles are limited to user/assistant. Images
 * (data URLs or https URLs) become vision content blocks. Nothing is rewritten.
 *
 * @param {{ systemPrompt: string, history?: Array<{role:string, content:string, images?:string[]}>, userText: string, images?: string[] }} p
 * @returns {Array<object>}
 */
export function buildMessages({ systemPrompt, history = [], userText = '', images = [] }) {
	const messages = [{ role: 'system', content: systemPrompt }];

	for (const turn of history) {
		if (turn.role !== 'user' && turn.role !== 'assistant') {
			continue;
		}
		if (turn.role === 'user' && Array.isArray(turn.images) && turn.images.length > 0) {
			messages.push({
				role: 'user',
				content: [
					{ type: 'text', text: String(turn.content || '') },
					...turn.images.map((url) => ({ type: 'image_url', image_url: { url } })),
				],
			});
		} else {
			messages.push({ role: turn.role, content: String(turn.content || '') });
		}
	}

	if (images.length > 0) {
		messages.push({
			role: 'user',
			content: [
				{ type: 'text', text: userText },
				...images.map((url) => ({ type: 'image_url', image_url: { url } })),
			],
		});
	} else {
		messages.push({ role: 'user', content: userText });
	}

	return messages;
}

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
 * Stream a chat completion as an SSE Node stream (content / error / completed).
 *
 * @param {{ messages: Array<object> }} params
 * @returns {PassThrough}
 */
export function streamCompletion({ messages }) {
	const cfg = getOpenAiConfig();
	const pass = new PassThrough();

	(async () => {
		try {
			requireKey(cfg);
			const response = await openAiFetch({
				model: cfg.model,
				temperature: cfg.temperature,
				max_tokens: cfg.maxTokens,
				stream: true,
				messages,
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
			logger.error('streamCompletion failed', err);
			pass.write(sse('error', err.message || 'AI generation failed'));
		} finally {
			pass.end(sse('completed', '[COMPLETED]'));
		}
	})();

	return pass;
}

/**
 * One-shot, non-streaming chat completion. Returns the assistant text.
 *
 * @param {{ messages: Array<object> }} params
 * @returns {Promise<string>}
 */
export async function createCompletion({ messages }) {
	const cfg = getOpenAiConfig();
	requireKey(cfg);
	const response = await openAiFetch({
		model: cfg.model,
		temperature: cfg.temperature,
		max_tokens: cfg.maxTokens,
		messages,
	}, cfg.apiKey);

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(`OpenAI request failed: ${response.status} ${response.statusText} ${body}`);
	}
	const json = await response.json();
	return json.choices?.[0]?.message?.content || '';
}
