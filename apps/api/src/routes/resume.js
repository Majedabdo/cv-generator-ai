import { generateResume, translateResume } from '../api/resume-engine.js';
import { resolvePrompt } from '../constants/prompt-store.js';

export default async (req, res) => {
	const { candidateInfo, jobDescription } = req.body || {};

	if (!candidateInfo || typeof candidateInfo !== 'string' || candidateInfo.trim().length < 10) {
		return res.status(422).json({ error: 'candidateInfo is required (share your details or a chat transcript first).' });
	}

	const info = candidateInfo.slice(0, 30000);
	const jd = typeof jobDescription === 'string' ? jobDescription.slice(0, 15000) : '';
	const resumeSystemPrompt = await resolvePrompt('resume');

	// 1) Generate the authoritative English version.
	const en = await generateResume({
		systemPrompt: resumeSystemPrompt,
		candidateInfo: info,
		jobDescription: jd,
		outputLanguage: 'en',
	});

	// 2) Translate it to Arabic so both versions share identical facts.
	let ar;
	try {
		ar = await translateResume({ bundle: en, targetLanguage: 'ar' });
	} catch (_) {
		// Fall back to a direct Arabic generation if translation fails.
		ar = await generateResume({
			systemPrompt: resumeSystemPrompt,
			candidateInfo: info,
			jobDescription: jd,
			outputLanguage: 'ar',
		});
	}

	res.json({ en, ar, bilingual: true });
};
