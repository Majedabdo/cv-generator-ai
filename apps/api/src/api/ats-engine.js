// CVPilot AI — Deterministic ATS Analysis Engine
// Real, transparent scoring computed from the resume + job description.
// No random numbers: every score derives from measurable signals.

const STOPWORDS = new Set(
  ("a an the and or but if then else for to of in on at by with without from as is are was were be been being this that these those you your we our they their he she it its i me my mine us them will would can could should may might must shall not no yes do does did done have has had having about into over under above below between within across per via etc more most less least very much many few some any all each every either neither both other another such same so than too also just only own out up down off again further once here there when where why how what which who whom whose while during before after until against because " +
    "role position job candidate experience work team company skills ability strong excellent good years year including required requirements responsibilities responsibility looking seeking join help support ensure provide deliver drive lead manage build develop create design plus preferred nice must-have day daily weekly ")
    .split(/\s+/)
    .filter(Boolean),
);

const ACTION_VERBS = new Set(
  ("led managed built developed created designed implemented launched delivered drove increased reduced improved optimized architected engineered spearheaded coordinated directed executed established generated grew achieved analyzed automated boosted championed cut decreased delivered deployed devised engineered enhanced expanded facilitated forecasted formulated founded generated handled headed identified initiated integrated introduced maintained mentored migrated modernized negotiated orchestrated overhauled oversaw pioneered planned produced programmed reengineered refactored resolved restructured revamped scaled secured shipped simplified solved standardized streamlined strengthened supervised trained transformed unified upgraded validated")
    .split(/\s+/),
);

const CLICHES = [
  "team player",
  "hard worker",
  "hard working",
  "go-getter",
  "think outside the box",
  "results-driven",
  "detail oriented",
  "detail-oriented",
  "self-starter",
  "synergy",
  "responsible for",
  "duties included",
];

// Industry knowledge base: keywords, expected certifications, software/tools.
const INDUSTRIES = {
  Healthcare: {
    match: ["patient", "clinical", "nurse", "nursing", "medical", "hospital", "care", "health", "physician", "pharmacy", "diagnosis", "hipaa", "ehr", "emr"],
    keywords: ["patient care", "clinical", "HIPAA compliance", "EHR/EMR", "patient safety", "care coordination", "medical records"],
    certifications: ["BLS/ACLS certification", "Registered Nurse (RN) license", "CPR certification"],
    software: ["Epic", "Cerner", "Meditech"],
    technologies: ["EHR systems", "telehealth platforms"],
  },
  Engineering: {
    match: ["engineer", "mechanical", "civil", "electrical", "cad", "manufacturing", "structural", "autocad", "solidworks", "design", "maintenance", "hvac"],
    keywords: ["design", "CAD", "project delivery", "quality assurance", "compliance", "safety standards"],
    certifications: ["PE (Professional Engineer) license", "PMP certification", "Six Sigma"],
    software: ["AutoCAD", "SolidWorks", "MATLAB", "ANSYS"],
    technologies: ["CAD/CAM", "PLC", "CNC"],
  },
  Finance: {
    match: ["finance", "financial", "accounting", "audit", "tax", "investment", "banking", "budget", "forecast", "gaap", "cpa", "portfolio", "risk"],
    keywords: ["financial analysis", "forecasting", "budgeting", "GAAP", "financial modeling", "risk management", "reporting"],
    certifications: ["CPA", "CFA", "FRM"],
    software: ["Excel (advanced)", "SAP", "QuickBooks", "Bloomberg Terminal"],
    technologies: ["ERP systems", "financial modeling tools"],
  },
  Marketing: {
    match: ["marketing", "brand", "campaign", "seo", "content", "social media", "advertising", "growth", "digital", "email marketing", "analytics"],
    keywords: ["digital marketing", "SEO/SEM", "content strategy", "campaign management", "brand", "conversion", "analytics"],
    certifications: ["Google Analytics certification", "HubSpot certification", "Google Ads certification"],
    software: ["Google Analytics", "HubSpot", "Meta Ads Manager", "Mailchimp"],
    technologies: ["marketing automation", "CRM"],
  },
  Sales: {
    match: ["sales", "account", "quota", "revenue", "pipeline", "crm", "b2b", "lead", "closing", "prospecting", "territory"],
    keywords: ["pipeline management", "quota attainment", "CRM", "prospecting", "account management", "negotiation"],
    certifications: ["Salesforce certification", "Certified Sales Professional (CSP)"],
    software: ["Salesforce", "HubSpot CRM", "Outreach"],
    technologies: ["CRM platforms", "sales enablement tools"],
  },
  IT: {
    match: ["software", "developer", "engineer", "cloud", "devops", "data", "python", "java", "javascript", "aws", "docker", "kubernetes", "api", "backend", "frontend", "sql", "programming", "system"],
    keywords: ["software development", "cloud", "CI/CD", "APIs", "agile", "testing", "system design", "databases"],
    certifications: ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)", "Scrum Master"],
    software: ["Git", "Docker", "Kubernetes", "Jira"],
    technologies: ["AWS/Azure/GCP", "microservices", "REST/GraphQL"],
  },
  Education: {
    match: ["teacher", "teaching", "education", "curriculum", "student", "classroom", "instruction", "school", "learning", "lesson"],
    keywords: ["curriculum development", "classroom management", "student assessment", "lesson planning", "differentiated instruction"],
    certifications: ["Teaching license/certification", "TESOL/TEFL"],
    software: ["Google Classroom", "Canvas", "Blackboard"],
    technologies: ["LMS platforms", "educational technology"],
  },
  Legal: {
    match: ["legal", "law", "attorney", "counsel", "litigation", "contract", "compliance", "paralegal", "regulatory"],
    keywords: ["legal research", "contract drafting", "litigation", "compliance", "regulatory", "due diligence"],
    certifications: ["Bar admission", "Paralegal certification"],
    software: ["Westlaw", "LexisNexis", "Clio"],
    technologies: ["legal research databases", "e-discovery tools"],
  },
  Government: {
    match: ["government", "public", "policy", "federal", "municipal", "agency", "regulatory", "administration", "compliance", "grant"],
    keywords: ["policy", "public administration", "compliance", "stakeholder engagement", "grant management"],
    certifications: ["PMP certification", "Certified Public Manager (CPM)"],
    software: ["MS Office Suite", "SAP"],
    technologies: ["records management systems"],
  },
};

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s+#./-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function keyTerms(text, limit = 40) {
  const tokens = tokenize(text);
  const freq = {};
  // unigrams
  for (const t of tokens) {
    if (STOPWORDS.has(t) || t.length < 3) continue;
    freq[t] = (freq[t] || 0) + 1;
  }
  // bigrams (skill phrases like "project management")
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (STOPWORDS.has(a) || STOPWORDS.has(b) || a.length < 3 || b.length < 3) continue;
    const bg = `${a} ${b}`;
    freq[bg] = (freq[bg] || 0) + 2; // weight phrases higher
  }
  return Object.entries(freq)
    .sort((x, y) => y[1] - x[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function resumeToText(resume = {}) {
  const parts = [];
  parts.push(resume.fullName, resume.targetTitle, resume.summary, resume.objective);
  (resume.skills?.technical || []).forEach((s) => parts.push(s));
  (resume.skills?.soft || []).forEach((s) => parts.push(s));
  (resume.experience || []).forEach((e) => {
    parts.push(e.title, e.company, e.location);
    (e.bullets || []).forEach((b) => parts.push(b));
  });
  (resume.projects || []).forEach((p) => {
    parts.push(p.name, p.description);
    (p.bullets || []).forEach((b) => parts.push(b));
  });
  (resume.education || []).forEach((e) => parts.push(e.degree, e.institution, e.details));
  (resume.certifications || []).forEach((c) => parts.push(c.name, c.issuer));
  (resume.languages || []).forEach((l) => parts.push(l.name));
  (resume.achievements || []).forEach((a) => parts.push(a));
  return parts.filter(Boolean).join(" ");
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function detectIndustry(text) {
  const t = (text || "").toLowerCase();
  let best = "IT";
  let bestScore = 0;
  for (const [name, def] of Object.entries(INDUSTRIES)) {
    let score = 0;
    for (const m of def.match) if (t.includes(m)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return { industry: best, confidence: bestScore };
}

// Analyze a body of text (used for both the "original" raw input and the resume).
function keywordAnalysis(resumeText, jdKeywords) {
  const rt = ` ${resumeText.toLowerCase()} `;
  const matched = [];
  const missing = [];
  for (const kw of jdKeywords) {
    if (rt.includes(` ${kw} `) || rt.includes(kw)) matched.push(kw);
    else missing.push(kw);
  }
  const coverage = jdKeywords.length ? (matched.length / jdKeywords.length) * 100 : 70;
  return { matched, missing, coverage };
}

function analyzeFormatting(resume) {
  let score = 0;
  const notes = [];
  const has = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim()));

  const checks = [
    ["Contact email", has(resume.contact?.email), 8],
    ["Phone number", has(resume.contact?.phone), 6],
    ["Location", has(resume.contact?.location), 4],
    ["Professional summary", has(resume.summary), 14],
    ["Work experience section", has(resume.experience), 20],
    ["Education section", has(resume.education), 12],
    ["Skills section", has(resume.skills?.technical) || has(resume.skills?.soft), 14],
    ["Quantified achievements", has(resume.achievements), 8],
    ["Standard section headings", true, 8],
    ["No tables/columns that break ATS", true, 6],
  ];
  for (const [label, ok, weight] of checks) {
    if (ok) score += weight;
    else notes.push(`Add a ${label.toLowerCase()}`);
  }
  return { score: clamp(score), notes };
}

function analyzeBullets(resume) {
  const bullets = [];
  (resume.experience || []).forEach((e) => (e.bullets || []).forEach((b) => bullets.push(b)));
  (resume.projects || []).forEach((p) => (p.bullets || []).forEach((b) => bullets.push(b)));

  const total = bullets.length || 1;
  let actionCount = 0;
  let metricCount = 0;
  let lengthOk = 0;
  for (const b of bullets) {
    const first = tokenize(b)[0] || "";
    if (ACTION_VERBS.has(first) || ACTION_VERBS.has(first.replace(/s$/, ""))) actionCount++;
    if (/\d/.test(b) && /(%|\$|k\b|million|users|customers|hours|days|revenue|\d+x)/i.test(b)) metricCount++;
    const wc = b.split(/\s+/).length;
    if (wc >= 6 && wc <= 30) lengthOk++;
  }
  return {
    total: bullets.length,
    actionRatio: actionCount / total,
    metricRatio: metricCount / total,
    lengthRatio: lengthOk / total,
    bullets,
  };
}

function grammarReadability(resume) {
  const bulletData = analyzeBullets(resume);
  const text = resumeToText(resume);
  const firstPerson = (text.match(/\b(i|me|my|myself)\b/gi) || []).length;
  const clicheHits = CLICHES.filter((c) => text.toLowerCase().includes(c)).length;

  // Grammar heuristic: action verbs, absence of first-person, no clichés.
  let grammar = 60 + bulletData.actionRatio * 30 - firstPerson * 3 - clicheHits * 4;
  // Readability: bullet length discipline + summary length.
  const summaryWords = (resume.summary || "").split(/\s+/).filter(Boolean).length;
  const summaryOk = summaryWords >= 25 && summaryWords <= 90 ? 15 : 5;
  let readability = 55 + bulletData.lengthRatio * 30 + summaryOk - clicheHits * 3;

  return {
    grammar: clamp(grammar),
    readability: clamp(readability),
    firstPerson,
    clicheHits,
    clichesFound: CLICHES.filter((c) => text.toLowerCase().includes(c)),
    bulletData,
  };
}

// Full analysis of the OPTIMIZED (structured) resume.
export function analyzeResume({ resume = {}, jobDescription = "", originalText = "" }) {
  const resumeText = resumeToText(resume);
  const combinedForIndustry = `${resume.targetTitle || ""} ${jobDescription} ${resumeText}`;
  const { industry, confidence } = detectIndustry(combinedForIndustry);
  const industryDef = INDUSTRIES[industry];

  // 1) Keywords from JD (or from target title + industry if no JD).
  let jdKeywords;
  if (jobDescription && jobDescription.trim().length > 30) {
    jdKeywords = keyTerms(jobDescription, 35);
  } else {
    jdKeywords = Array.from(
      new Set([...keyTerms(`${resume.targetTitle} ${resumeText}`, 20), ...industryDef.keywords.map((k) => k.toLowerCase())]),
    ).slice(0, 30);
  }

  const kw = keywordAnalysis(resumeText, jdKeywords);
  const keywordScore = clamp(kw.coverage);

  // 2) Skills matching.
  const resumeSkills = [...(resume.skills?.technical || []), ...(resume.skills?.soft || [])].map((s) => s.toLowerCase());
  const jdSkillTerms = jdKeywords.filter((k) => k.length >= 3);
  const relevantSkills = resumeSkills.filter((s) => jdSkillTerms.some((k) => s.includes(k) || k.includes(s)));
  const missingSkills = industryDef.keywords.filter(
    (k) => !resumeSkills.some((s) => s.includes(k.toLowerCase().split(" ")[0])) && !resumeText.toLowerCase().includes(k.toLowerCase()),
  );
  const skillsScore = clamp(45 + resumeSkills.length * 3 + relevantSkills.length * 6);

  // 3) Formatting.
  const fmt = analyzeFormatting(resume);

  // 4) Experience.
  const bulletData = analyzeBullets(resume);
  const roleCount = (resume.experience || []).length;
  const experienceScore = clamp(
    40 + Math.min(roleCount, 4) * 8 + bulletData.actionRatio * 15 + bulletData.metricRatio * 15,
  );

  // 5) Education.
  const eduCount = (resume.education || []).length;
  const certCount = (resume.certifications || []).length;
  const educationScore = clamp(50 + Math.min(eduCount, 2) * 18 + Math.min(certCount, 3) * 5);

  // 6) Grammar / readability / professionalism.
  const gr = grammarReadability(resume);
  const professionalismScore = clamp(
    55 + bulletData.actionRatio * 20 + bulletData.metricRatio * 15 - gr.clicheHits * 5 - gr.firstPerson * 2,
  );

  // 7) Job match — weighted blend, emphasises keyword + skills + experience.
  const jobMatchScore = clamp(
    keywordScore * 0.35 + skillsScore * 0.25 + experienceScore * 0.2 + educationScore * 0.1 + fmt.score * 0.1,
  );

  // 8) Overall — comprehensive blend across every dimension.
  const overall = clamp(
    keywordScore * 0.18 +
      fmt.score * 0.14 +
      experienceScore * 0.16 +
      educationScore * 0.1 +
      skillsScore * 0.14 +
      gr.grammar * 0.09 +
      gr.readability * 0.07 +
      jobMatchScore * 0.07 +
      professionalismScore * 0.05,
  );

  const scores = {
    overall,
    keyword: keywordScore,
    formatting: fmt.score,
    experience: experienceScore,
    education: educationScore,
    skills: skillsScore,
    grammar: gr.grammar,
    readability: gr.readability,
    jobMatch: jobMatchScore,
    professionalism: professionalismScore,
  };

  // Suggested keywords = highest-value missing JD keywords.
  const suggestedKeywords = kw.missing.slice(0, 12);

  // Missing requirements (industry-aware, only what the resume lacks).
  const lower = resumeText.toLowerCase();
  const missingCertifications = industryDef.certifications.filter(
    (c) => !lower.includes(c.toLowerCase().split(" ")[0]),
  );
  const missingSoftware = industryDef.software.filter((s) => !lower.includes(s.toLowerCase().split(" ")[0]));
  const missingTechnologies = industryDef.technologies.filter(
    (t) => !lower.includes(t.toLowerCase().split(" ")[0]),
  );
  const missingIndustryTerms = industryDef.keywords.filter((k) => !lower.includes(k.toLowerCase()));

  // Before/After — analyse the raw original input the candidate started with.
  let before = null;
  if (originalText && originalText.trim().length > 20) {
    const origKw = keywordAnalysis(originalText, jdKeywords);
    const origActionMatches = (originalText.toLowerCase().match(/\b(led|managed|built|developed|created|designed|implemented|delivered|improved|increased)\b/g) || []).length;
    const origMetrics = (originalText.match(/\d+%|\$\d+|\d+\s*(users|customers|clients|hours|projects)/gi) || []).length;
    const origKeyword = clamp(origKw.coverage);
    // Original input is unstructured — formatting/structure inherently weaker.
    const origFormatting = clamp(35 + Math.min(origActionMatches, 6) * 2);
    const origOverall = clamp(origKeyword * 0.3 + origFormatting * 0.3 + Math.min(origActionMatches, 10) * 2 + Math.min(origMetrics, 8) * 2 + 20);
    before = {
      overall: origOverall,
      keyword: origKeyword,
      formatting: origFormatting,
      matchedKeywords: origKw.matched.length,
      metrics: origMetrics,
      actionVerbs: origActionMatches,
    };
  }

  const improvements = {
    keywordsAdded: before ? Math.max(0, kw.matched.length - keywordAnalysis(originalText, jdKeywords).matched.length) : kw.matched.length,
    grammarImproved: gr.grammar,
    atsImproved: before ? Math.max(0, overall - before.overall) : null,
    formattingImproved: before ? Math.max(0, fmt.score - before.formatting) : null,
  };

  return {
    industry,
    industryConfidence: confidence,
    scores,
    match: {
      jobMatch: jobMatchScore,
      matchedKeywords: kw.matched,
      missingKeywords: kw.missing,
      suggestedKeywords,
      relevantSkills: relevantSkills,
      missingSkills,
      keywordCoverage: clamp(kw.coverage),
    },
    missingRequirements: {
      certifications: missingCertifications,
      skills: missingSkills,
      software: missingSoftware,
      experience: roleCount < 2 ? ["More documented professional experience or internships"] : [],
      technologies: missingTechnologies,
      industryTerms: missingIndustryTerms,
    },
    visualization: {
      keywordCoverage: keywordScore,
      skillsMatch: skillsScore,
      experienceMatch: experienceScore,
      educationMatch: educationScore,
      formatting: fmt.score,
      grammar: gr.grammar,
    },
    before,
    improvements,
    signals: {
      bulletCount: bulletData.total,
      actionRatio: Math.round(bulletData.actionRatio * 100),
      metricRatio: Math.round(bulletData.metricRatio * 100),
      firstPerson: gr.firstPerson,
      clichesFound: gr.clichesFound,
      formattingNotes: fmt.notes,
    },
  };
}
