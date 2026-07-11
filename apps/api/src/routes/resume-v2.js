import { generateResume, translateResume } from '../api/resume-engine.js';
import { resolvePrompt } from '../constants/prompt-store.js';

/**
 * POST /resume-v2/generate
 *
 * Resume generation backed ONLY by the OpenAI API. Supports two flows:
 *   mode='create'   — generate a new ATS resume from the conversation data
 *   mode='optimize' — enhance an existing resume, preserving all facts
 *
 * Body:
 *   candidateInfo  — string (conversation transcript / CV text, verbatim)
 *   jobDescription — string (optional, verbatim)
 *   mode           — 'create' | 'optimize' (default 'create')
 *
 * Returns { en, ar, bilingual:true } — both languages share identical facts.
 */
export default async (req, res) => {
	const { candidateInfo, jobDescription, mode } = req.body || {};

	if (!candidateInfo || typeof candidateInfo !== 'string' || candidateInfo.trim().length < 10) {
		return res.status(422).json({ error: 'candidateInfo is required (share your details, CV, or the chat transcript first).' });
	}

	const info = candidateInfo.slice(0, 30000);
	const jd = typeof jobDescription === 'string' ? jobDescription.slice(0, 15000) : '';
	const flow = mode === 'optimize' ? 'optimize' : 'create';

	let resumeSystemPrompt = await resolvePrompt('resume');
	if (flow === 'optimize') {
		resumeSystemPrompt += '\n\nOPTIMIZE MODE: The candidate info is an EXISTING resume. Preserve every fact (employers, titles, dates, education, metrics) exactly. Only improve wording, structure and ATS keyword alignment. Never invent or remove factual content.';
	} else {
		resumeSystemPrompt += '\n\nCREATE MODE: Build a new resume using only the information provided. Never fabricate experience, companies, dates or achievements.';
	}

	// 1) Authoritative English version.
	const en = await generateResume({
		systemPrompt: resumeSystemPrompt,
		candidateInfo: info,
		jobDescription: jd,
		outputLanguage: 'en',
	});

	// 2) Arabic version — translated so both share identical facts.
	let ar;
	try {
		ar = await translateResume({ bundle: en, targetLanguage: 'ar' });
	} catch (_) {
		ar = await generateResume({
			systemPrompt: resumeSystemPrompt,
			candidateInfo: info,
			jobDescription: jd,
			outputLanguage: 'ar',
		});
	}

	res.json({ en, ar, bilingual: true, mode: flow });
};
