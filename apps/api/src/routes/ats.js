import { analyzeResume } from "../api/ats-engine.js";
import { generateText, extractJson } from "../api/resume-engine.js";

const ATS_NARRATIVE_PROMPT = `You are a Senior HR recruiter and ATS optimization expert reviewing a resume for a specific job. You are given (a) a resume, (b) a target job description, (c) an industry, and (d) a set of computed ATS metrics.

Write a transparent, actionable, HONEST assessment. Never fabricate. Base everything on the actual resume content and the computed metrics provided.

Respond with ONE valid JSON object and NOTHING else (no markdown, no code fences), matching exactly:

{
  "jobMatchReason": string,            // 1-2 sentences explaining WHY the job match score is what it is
  "jobMatchHighlights": [string],      // 4-6 short bullet reasons, e.g. "Strong healthcare experience", "Missing leadership examples"
  "strengths": [string],               // 4-6 concrete strengths of this resume for this role
  "weaknesses": [string],              // 4-6 concrete weaknesses / gaps
  "recommendations": [string],         // 5-7 specific, actionable recommendations
  "priorityImprovements": [string],    // 3-4 highest-impact changes, ordered by impact
  "quickWins": [string],               // 3-4 easy fixes the user can do in minutes
  "certificationRecommendations": [ { "name": string, "why": string } ],  // 3-5, relevant to the target job & industry
  "courseRecommendations": [string],   // 3-5 courses/training relevant to the target job
  "careerImprovement": {
    "skillsToLearn": [string],
    "softwareToLearn": [string],
    "languages": [string],
    "professionalDevelopment": [string]
  }
}

Write in the same language as the resume. Be specific to THIS candidate and role. Return ONLY the JSON object.`;

export default async (req, res) => {
  const { resume, bundle, jobDescription = "", originalText = "" } = req.body || {};
  const resumeData = resume || bundle?.resume;

  if (!resumeData || typeof resumeData !== "object") {
    return res.status(422).json({ error: "A resume object is required for ATS analysis." });
  }

  // 1) Deterministic analysis — real, transparent scoring.
  const analysis = analyzeResume({
    resume: resumeData,
    jobDescription: typeof jobDescription === "string" ? jobDescription.slice(0, 15000) : "",
    originalText: typeof originalText === "string" ? originalText.slice(0, 20000) : "",
  });

  // 2) AI narrative enrichment grounded in the computed metrics.
  let narrative = {};
  try {
    const userText = [
      `# INDUSTRY\n${analysis.industry}`,
      `# COMPUTED ATS METRICS\n${JSON.stringify(analysis.scores)}`,
      `# MATCHED KEYWORDS\n${analysis.match.matchedKeywords.join(", ") || "(none)"}`,
      `# MISSING KEYWORDS\n${analysis.match.missingKeywords.join(", ") || "(none)"}`,
      `# MISSING REQUIREMENTS\n${JSON.stringify(analysis.missingRequirements)}`,
      `# TARGET JOB DESCRIPTION\n${jobDescription || "(none provided — infer from resume target title)"}`,
      `# RESUME (JSON)\n${JSON.stringify(resumeData).slice(0, 12000)}`,
      "",
      "Now produce the assessment JSON exactly as specified.",
    ].join("\n\n");
    const raw = await generateText({ systemPrompt: ATS_NARRATIVE_PROMPT, userText });
    narrative = extractJson(raw);
  } catch (err) {
    // Deterministic report is still fully useful without the narrative.
    narrative = {
      jobMatchReason: `This resume achieves a ${analysis.scores.jobMatch}% match against the target role based on keyword coverage, skills and experience alignment.`,
      jobMatchHighlights: [
        `${analysis.match.matchedKeywords.length} target keywords matched`,
        `${analysis.match.missingKeywords.length} keywords still missing`,
        `${analysis.signals.bulletCount} achievement bullets analyzed`,
      ],
      strengths: [],
      weaknesses: [],
      recommendations: analysis.match.suggestedKeywords.map((k) => `Incorporate the keyword "${k}" naturally where relevant.`),
      priorityImprovements: [],
      quickWins: analysis.signals.formattingNotes,
      certificationRecommendations: analysis.missingRequirements.certifications.map((c) => ({ name: c, why: `Commonly expected in ${analysis.industry} roles.` })),
      courseRecommendations: [],
      careerImprovement: { skillsToLearn: analysis.missingRequirements.skills, softwareToLearn: analysis.missingRequirements.software, languages: [], professionalDevelopment: [] },
    };
  }

  res.json({ ...analysis, narrative });
};
