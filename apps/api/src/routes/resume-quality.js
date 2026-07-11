import { reviewResume } from '../api/quality-engine.js';
import { resolvePrompt } from '../constants/prompt-store.js';

export default async (req, res) => {
	const { bundle, resume, jobDescription, originalText } = req.body || {};
	const targetResume = resume || bundle?.resume;

	if (!targetResume || typeof targetResume !== 'object') {
		return res.status(422).json({ error: 'A generated resume is required for quality review.' });
	}

	const reviewed = await reviewResume({
		systemPrompt: await resolvePrompt('quality'),
		resume: targetResume,
		jobDescription: typeof jobDescription === 'string' ? jobDescription.slice(0, 15000) : '',
		originalText: typeof originalText === 'string' ? originalText.slice(0, 30000) : '',
	});

	res.json(reviewed);
};
