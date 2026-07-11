import { generateText as providerGenerateText } from './ai-provider.js';

/**
 * One-shot structured text generation routed through the configured AI
 * provider (OpenAI by default, admin-configurable). Used for resume JSON,
 * quality review and ATS narrative generation. Nothing is persisted.
 *
 * @param {{ systemPrompt: string, userText: string, images?: string[] }} params
 * @returns {Promise<string>} the assistant text
 */
export async function generateText({ systemPrompt, userText, images = [] }) {
	return providerGenerateText({ systemPrompt, userText, images });
}

/**
 * Extracts the first balanced JSON object from a string, tolerating stray
 * prose or markdown code fences around it.
 *
 * @param {string} text
 * @returns {object}
 */
export function extractJson(text) {
	let cleaned = text.trim();
	// strip markdown fences
	cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

	const start = cleaned.indexOf('{');
	if (start === -1) {
		throw new Error('AI response did not contain JSON');
	}

	let depth = 0;
	let inString = false;
	let escape = false;
	for (let i = start; i < cleaned.length; i++) {
		const ch = cleaned[i];
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === '\\') {
			escape = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) {
			continue;
		}
		if (ch === '{') depth++;
		if (ch === '}') {
			depth--;
			if (depth === 0) {
				const candidate = cleaned.slice(start, i + 1);
				return JSON.parse(candidate);
			}
		}
	}

	throw new Error('AI response contained malformed JSON');
}

/**
 * Generates a structured, ATS-optimized resume bundle from raw candidate input.
 *
 * @param {{ systemPrompt: string, candidateInfo: string, jobDescription?: string, images?: string[] }} params
 * @returns {Promise<object>}
 */
export async function generateResume({ systemPrompt, candidateInfo, jobDescription = '', images = [], outputLanguage = '' }) {
	const langLine = outputLanguage === 'ar'
		? 'CRITICAL: Write the ENTIRE resume output in professional Modern Standard Arabic (العربية), regardless of the input language. Keep proper nouns (company names, technologies) in their original form.'
		: outputLanguage === 'en'
			? 'CRITICAL: Write the ENTIRE resume output in professional English, regardless of the input language. Keep proper nouns in their original form.'
			: '';

	const userText = [
		'# CANDIDATE INFORMATION (chat transcript, old resume text, notes)',
		candidateInfo || '(none provided)',
		'',
		'# TARGET JOB DESCRIPTION',
		jobDescription || '(no specific job description provided — infer the target role from the candidate information and optimize for a strong general application)',
		'',
		langLine,
		'',
		'Now generate the complete resume JSON bundle exactly as specified in your instructions. Return ONLY the JSON object.',
	].join('\n');

	const raw = await generateText({ systemPrompt, userText, images });
	return extractJson(raw);
}

/**
 * Translates a generated resume bundle to a target language, preserving the
 * exact JSON structure and all facts (never invents or drops information).
 *
 * @param {{ bundle: object, targetLanguage: 'ar' | 'en' }} params
 * @returns {Promise<object>}
 */
export async function translateResume({ bundle, targetLanguage }) {
	const langName = targetLanguage === 'ar' ? 'professional Modern Standard Arabic (العربية)' : 'professional English';
	const systemPrompt = `You are a professional resume translator. You receive a JSON resume bundle and translate every human-readable string value into ${langName}. HARD RULES:
- Preserve the EXACT JSON structure, all keys, arrays and nesting. Do not add or remove keys.
- Translate only text values; keep numeric scores unchanged.
- Keep proper nouns (company names, product/technology names, personal names, emails, URLs, phone numbers) in their original form.
- Never invent, add, or omit any information — only translate what is present.
- Produce natural, fluent, professional language (not literal machine translation).
Return ONLY the translated JSON object, no markdown, no commentary.`;

	const userText = `Translate this resume bundle to ${langName}. Return ONLY the JSON object:\n\n${JSON.stringify(bundle)}`;
	const raw = await generateText({ systemPrompt, userText });
	return extractJson(raw);
}
