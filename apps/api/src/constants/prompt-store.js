import { pocketbaseClient } from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { SystemPrompt } from './prompts.js';
import { ResumeEngineSystemPrompt } from './resume-prompt.js';
import { QualityEngineSystemPrompt } from './quality-prompt.js';

/**
 * Single source of truth for every AI behavior rule.
 *
 * All prompt text lives here (or, when an admin overrides it, in the
 * `app_settings` row with key "prompts"). Application code contains NO
 * behavioral rules — it only resolves and forwards the prompt below to the
 * model. The Admin Dashboard reads/writes the same `prompts` settings row via
 * `/admin/settings/prompts`, so edits take effect immediately on the next
 * request (each resolve reads the current value; nothing is cached).
 *
 * Keys:
 *   chat    — the "Pilot" conversation system prompt (chat endpoint)
 *   resume  — the resume generation engine system prompt
 *   quality — the final quality-review engine system prompt
 */
export const PROMPT_DEFAULTS = Object.freeze({
	chat: SystemPrompt,
	resume: ResumeEngineSystemPrompt,
	quality: QualityEngineSystemPrompt,
});

// A short version stamp logged with each request for debugging. Bump when the
// default prompts change materially.
const PROMPT_VERSION = '2026-07-11.1';

/**
 * Resolve the current prompt for the given kind. Reads the admin-editable
 * override from PocketBase every call (no cache) so changes apply immediately.
 * Falls back to the code default if no override exists or the store is
 * unreachable.
 *
 * @param {'chat'|'resume'|'quality'} kind
 * @returns {Promise<string>}
 */
export async function resolvePrompt(kind) {
	const fallback = PROMPT_DEFAULTS[kind] || '';
	let source = 'default';
	let text = fallback;

	try {
		const rec = await pocketbaseClient.collection('app_settings').getFirstListItem('key = "prompts"');
		const override = rec?.value?.[kind];
		if (typeof override === 'string' && override.trim().length > 20) {
			text = override;
			source = 'admin';
		}
	} catch {
		// no override row / store unavailable — use the code default
	}

	logger.info(`prompt.resolve kind=${kind} source=${source} version=${PROMPT_VERSION}`);
	return text;
}
