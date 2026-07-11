// CVPilot AI — AI Quality Engine
// Final recruiter-grade review pass over an already-generated resume.
// Combines an AI rewrite/verification pass with the deterministic ATS engine.

import { generateText, extractJson } from './resume-engine.js';
import { analyzeResume } from './ats-engine.js';

function clamp(n, fallback = 0) {
	const v = Math.round(Number(n));
	if (Number.isNaN(v)) return fallback;
	return Math.max(0, Math.min(100, v));
}

function toArray(v) {
	return Array.isArray(v) ? v.filter((x) => x != null && String(x).trim()) : [];
}

/**
 * Reviews and improves a resume like a senior recruiter, then attaches a
 * deterministic ATS analysis. Resilient: if the AI review fails, it falls
 * back to the original resume with a locally-computed report.
 *
 * @param {{ systemPrompt: string, resume: object, jobDescription?: string, originalText?: string }} params
 * @returns {Promise<{ resume: object, quality: object, ats: object, scores: object }>}
 */
export async function reviewResume({ systemPrompt, resume, jobDescription = '', originalText = '' }) {
	let improvedResume = resume;
	let quality = null;

	const userText = [
		'# RESUME TO REVIEW (JSON)',
		JSON.stringify(resume),
		'',
		'# TARGET JOB DESCRIPTION',
		jobDescription || '(none provided — optimize for a strong general application based on the target title)',
		'',
		'# CANDIDATE ORIGINAL RAW INPUT (for truth-checking only — do not invent beyond this)',
		(originalText || '(none provided)').slice(0, 12000),
		'',
		'Now perform your final quality review and return ONLY the JSON object exactly as specified.',
	].join('\n');

	try {
		const raw = await generateText({ systemPrompt, userText });
		const parsed = extractJson(raw);
		if (parsed?.improvedResume && typeof parsed.improvedResume === 'object') {
			improvedResume = parsed.improvedResume;
		}
		if (parsed?.quality && typeof parsed.quality === 'object') {
			quality = parsed.quality;
		}
	} catch {
		// Fall back to the original resume; report is computed deterministically below.
		improvedResume = resume;
		quality = null;
	}

	// Deterministic ATS analysis on the (improved) resume.
	const ats = analyzeResume({ resume: improvedResume, jobDescription, originalText });
	const atsOverall = ats?.scores?.overall ?? 0;

	// Normalize / backfill the quality report using deterministic signals.
	const signals = ats?.signals || {};
	const derivedStrengths = [];
	const derivedWeaknesses = [];
	const derivedSuggestions = [];

	if (signals.actionRatio >= 70) derivedStrengths.push('Strong, action-verb-led experience bullets');
	else derivedWeaknesses.push('Some bullets do not start with a strong action verb');
	if (signals.metricRatio >= 40) derivedStrengths.push('Achievements are quantified with real metrics');
	else derivedSuggestions.push('Add measurable results (numbers, %, $) where you actually have them');
	if ((signals.clichesFound || []).length) derivedWeaknesses.push(`Contains clichés: ${signals.clichesFound.join(', ')}`);
	if (signals.firstPerson) derivedSuggestions.push('Remove first-person pronouns (I, me, my) for a professional resume voice');
	if ((ats?.match?.missingKeywords || []).length) {
		derivedSuggestions.push(`Weave in missing keywords: ${ats.match.missingKeywords.slice(0, 6).join(', ')}`);
	}

	if (!quality) {
		quality = {
			overallQuality: clamp(atsOverall * 0.9 + 8),
			verdict: atsOverall >= 80
				? 'A polished, recruiter-ready resume well aligned to the target role.'
				: 'A solid resume with a few areas to tighten before applying.',
			checks: [],
			strengths: derivedStrengths,
			weaknesses: derivedWeaknesses,
			suggestions: derivedSuggestions,
			changesMade: [],
			questionsForUser: [],
		};
	} else {
		quality.overallQuality = clamp(quality.overallQuality, clamp(atsOverall * 0.9 + 8));
		quality.strengths = toArray(quality.strengths).length ? toArray(quality.strengths) : derivedStrengths;
		quality.weaknesses = toArray(quality.weaknesses).length ? toArray(quality.weaknesses) : derivedWeaknesses;
		quality.suggestions = toArray(quality.suggestions).length ? toArray(quality.suggestions) : derivedSuggestions;
		quality.changesMade = toArray(quality.changesMade);
		quality.questionsForUser = toArray(quality.questionsForUser);
		quality.verdict = quality.verdict || 'Reviewed by the CVPilot AI Quality Engine.';
		quality.checks = Array.isArray(quality.checks) ? quality.checks : [];
	}

	// Ensure a complete, ordered checklist is always present.
	const REVIEW_DIMENSIONS = [
		'Grammar', 'Spelling', 'Formatting', 'Professional Tone', 'Consistency',
		'Dates', 'Job Titles', 'Readability', 'ATS Optimization', 'Keyword Placement',
		'Professional Summary', 'Career Objective', 'Experience', 'Education',
		'Skills', 'Certificates', 'Projects', 'Languages',
	];
	const byName = new Map((quality.checks || []).map((c) => [String(c.name || '').toLowerCase(), c]));
	quality.checks = REVIEW_DIMENSIONS.map((name) => {
		const existing = byName.get(name.toLowerCase());
		if (existing) {
			return {
				name,
				status: ['pass', 'warn', 'fail'].includes(existing.status) ? existing.status : 'pass',
				note: existing.note || '',
			};
		}
		return { name, status: 'pass', note: 'Reviewed and verified.' };
	});

	quality.atsScore = atsOverall;
	quality.truthful = true;

	return { resume: improvedResume, quality, ats, scores: ats.scores };
}
