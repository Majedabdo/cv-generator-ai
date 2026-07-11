function line(s) {
  return s ? `${s}\n` : "";
}

export function resumeToPlainText(bundle) {
  const r = bundle?.resume || {};
  let out = "";
  out += `${(r.fullName || "").toUpperCase()}\n`;
  if (r.targetTitle) out += `${r.targetTitle}\n`;
  const contact = [r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin, r.contact?.portfolio].filter(Boolean).join(" | ");
  out += line(contact);
  out += "\n";

  if (r.summary) out += `PROFESSIONAL SUMMARY\n${r.summary}\n\n`;

  const tech = r.skills?.technical || [];
  const soft = r.skills?.soft || [];
  if (tech.length || soft.length) {
    out += "SKILLS\n";
    if (tech.length) out += `Technical: ${tech.join(", ")}\n`;
    if (soft.length) out += `Soft: ${soft.join(", ")}\n`;
    out += "\n";
  }

  if (r.experience?.length) {
    out += "EXPERIENCE\n";
    for (const x of r.experience) {
      out += `${x.title} — ${[x.company, x.location].filter(Boolean).join(", ")} (${[x.start, x.end].filter(Boolean).join(" - ")})\n`;
      for (const b of x.bullets || []) out += `  - ${b}\n`;
      out += "\n";
    }
  }

  if (r.projects?.length) {
    out += "PROJECTS\n";
    for (const p of r.projects) {
      out += `${p.name}${p.description ? ` — ${p.description}` : ""}\n`;
      for (const b of p.bullets || []) out += `  - ${b}\n`;
    }
    out += "\n";
  }

  if (r.education?.length) {
    out += "EDUCATION\n";
    for (const e of r.education) {
      out += `${e.degree} — ${[e.institution, e.location].filter(Boolean).join(", ")} (${[e.start, e.end].filter(Boolean).join(" - ")})\n`;
      if (e.details) out += `  ${e.details}\n`;
    }
    out += "\n";
  }

  if (r.certifications?.length) {
    out += "CERTIFICATIONS\n";
    for (const c of r.certifications) out += `  - ${c.name}${[c.issuer, c.year].filter(Boolean).length ? ` (${[c.issuer, c.year].filter(Boolean).join(", ")})` : ""}\n`;
    out += "\n";
  }

  if (r.languages?.length) {
    out += "LANGUAGES\n";
    out += `  ${r.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`).join(", ")}\n\n`;
  }

  if (r.achievements?.length) {
    out += "KEY ACHIEVEMENTS\n";
    for (const a of r.achievements) out += `  - ${a}\n`;
  }

  return out.trim() + "\n";
}

export function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportTxt(bundle, name) {
  downloadBlob(`${name}.txt`, resumeToPlainText(bundle), "text/plain;charset=utf-8");
}

export function exportDocx(bundle, name, htmlNode) {
  const inner = htmlNode ? htmlNode.outerHTML : `<pre>${resumeToPlainText(bundle)}</pre>`;
  const html = `<!DOCTYPE html><html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${name}</title></head><body>${inner}</body></html>`;
  downloadBlob(`${name}.doc`, html, "application/msword");
}

export function exportAtsReportPdf(data, name) {
  if (!data) return;
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const { scores = {}, match = {}, missingRequirements = {}, before, narrative = {}, industry, signals = {} } = data;

  const barRow = (label, v) => {
    const val = Math.max(0, Math.min(100, v || 0));
    const color = val >= 80 ? "#16a34a" : val >= 60 ? "#d97706" : "#dc2626";
    return `<div class="bar"><div class="bl"><span>${esc(label)}</span><b style="color:${color}">${val}%</b></div><div class="bt"><div class="bf" style="width:${val}%;background:${color}"></div></div></div>`;
  };
  const chips = (arr) => (arr || []).map((x) => `<span class="chip">${esc(typeof x === "string" ? x : x.name)}</span>`).join("") || "<i>—</i>";
  const list = (arr) => (arr || []).map((x) => `<li>${esc(typeof x === "string" ? x : x.name)}</li>`).join("") || "<li><i>—</i></li>";
  const certs = (narrative.certificationRecommendations || []).map((c) => `<li><b>${esc(c.name)}</b>${c.why ? ` — ${esc(c.why)}` : ""}</li>`).join("") || "<li><i>—</i></li>";

  const scoreBars = [
    ["Keyword", scores.keyword], ["Formatting", scores.formatting], ["Experience", scores.experience],
    ["Education", scores.education], ["Skills", scores.skills], ["Grammar", scores.grammar],
    ["Readability", scores.readability], ["Job Match", scores.jobMatch], ["Professionalism", scores.professionalism],
  ].map(([l, v]) => barRow(l, v)).join("");

  const overallColor = scores.overall >= 80 ? "#16a34a" : scores.overall >= 60 ? "#d97706" : "#dc2626";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(name)} — ATS Report</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 2px solid #7c3aed; padding-bottom: 4px; color: #6d28d9; }
  .muted { color: #64748b; font-size: 12px; }
  .top { display: flex; align-items: center; gap: 20px; margin: 14px 0; }
  .overall { width: 110px; height: 110px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 8px solid ${overallColor}; }
  .overall b { font-size: 32px; color: ${overallColor}; line-height: 1; }
  .overall span { font-size: 10px; color: #64748b; }
  .match { flex: 1; background: #f5f3ff; border-radius: 10px; padding: 12px 14px; }
  .bar { margin: 6px 0; }
  .bl { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
  .bt { height: 7px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
  .bf { height: 100%; border-radius: 6px; }
  .chip { display: inline-block; background: #eef2ff; color: #334155; border-radius: 6px; padding: 3px 8px; margin: 2px; font-size: 11px; }
  ul { margin: 4px 0; padding-left: 18px; font-size: 12px; }
  li { margin: 3px 0; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .foot { margin-top: 18px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style></head><body>
  <h1>ATS Analysis Report</h1>
  <div class="muted">${esc(name)} · Detected industry: <b>${esc(industry)}</b> · Generated by CVPilot AI</div>
  <div class="top">
    <div class="overall"><b>${scores.overall || 0}</b><span>OVERALL / 100</span></div>
    <div class="match"><div style="font-size:13px;font-weight:bold">Job Match: ${match.jobMatch || 0}%</div><div class="muted" style="margin-top:4px">${esc(narrative.jobMatchReason)}</div></div>
  </div>
  <h2>Detailed ATS Scores</h2>${scoreBars}
  ${before ? `<h2>Before &amp; After</h2><div class="muted">Original input score: <b>${before.overall}</b> → Optimized resume score: <b style="color:${overallColor}">${scores.overall}</b></div>` : ""}
  <h2>Keyword Match</h2>
  <div style="font-size:11px;font-weight:bold;color:#16a34a">Matched</div>${chips(match.matchedKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#dc2626;margin-top:6px">Missing</div>${chips(match.missingKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#d97706;margin-top:6px">Suggested</div>${chips(match.suggestedKeywords)}
  <div class="grid2"><div><h2>Strengths</h2><ul>${list(narrative.strengths)}</ul></div><div><h2>Weaknesses</h2><ul>${list(narrative.weaknesses)}</ul></div></div>
  <h2>Recommendations</h2><ul>${list(narrative.recommendations)}</ul>
  <div class="grid2"><div><h2>Priority Improvements</h2><ul>${list(narrative.priorityImprovements)}</ul></div><div><h2>Quick Wins</h2><ul>${list(narrative.quickWins)}</ul></div></div>
  <h2>Missing Requirements</h2>
  <div class="muted">Certifications:</div>${chips(missingRequirements.certifications)}
  <div class="muted" style="margin-top:4px">Software:</div>${chips(missingRequirements.software)}
  <div class="muted" style="margin-top:4px">Technologies:</div>${chips(missingRequirements.technologies)}
  <h2>Certification Recommendations</h2><ul>${certs}</ul>
  <h2>Career Improvement</h2>
  <div class="muted">Skills to learn:</div>${chips(narrative.careerImprovement?.skillsToLearn)}
  <div class="muted" style="margin-top:4px">Software to learn:</div>${chips(narrative.careerImprovement?.softwareToLearn)}
  <div class="foot">Transparency: analyzed ${signals.bulletCount || 0} achievement bullets · ${signals.actionRatio || 0}% start with an action verb · ${signals.metricRatio || 0}% contain quantified metrics · ${(match.matchedKeywords || []).length}/${((match.matchedKeywords || []).length + (match.missingKeywords || []).length)} target keywords matched.</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`;
  w.document.write(html);
  w.document.close();
}

/* ---------------------- data-driven ATS-friendly PDF ---------------------- */

const ARABIC_RE = /[\u0600-\u06FF]/;

function detectRtl(bundle) {
  const r = bundle?.resume || {};
  const meta = bundle?.language || bundle?.locale || r.language || r.locale;
  if (typeof meta === "string" && /ar|arabic|rtl/i.test(meta)) return true;
  const sample = [
    r.fullName, r.targetTitle, r.summary,
    ...(r.experience || []).map((x) => `${x.title} ${(x.bullets || []).join(" ")}`),
  ].join(" ");
  return ARABIC_RE.test(sample);
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

/**
 * Builds a real, ATS-friendly A4 resume PDF from structured resume data
 * (selectable text, not a screenshot) and opens the browser print dialog
 * so the user can save it as PDF. Supports Arabic (RTL) and English (LTR).
 *
 * @param {object} bundle       the resume bundle ({ resume, ... })
 * @param {string} name         base filename / document title
 * @param {object} [opts]       { accent?: string }
 */
export function exportResumePdf(bundle, name, opts = {}) {
  const r = bundle?.resume || {};
  const rtl = detectRtl(bundle);
  const dir = rtl ? "rtl" : "ltr";
  const accent = opts.accent || "#6d28d9";
  const t = rtl
    ? {
        summary: "الملخص المهني", skills: "المهارات", tech: "المهارات التقنية", soft: "المهارات الشخصية",
        exp: "الخبرة العملية", proj: "المشاريع", edu: "التعليم", cert: "الشهادات",
        lang: "اللغات", ach: "أبرز الإنجازات",
      }
    : {
        summary: "Professional Summary", skills: "Skills", tech: "Technical", soft: "Soft Skills",
        exp: "Professional Experience", proj: "Projects", edu: "Education", cert: "Certifications",
        lang: "Languages", ach: "Key Achievements",
      };

  const contact = [r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin, r.contact?.portfolio]
    .filter(Boolean).map(esc).join('<span class="sep">•</span>');

  const section = (title, inner) => (inner ? `<section><h2>${esc(title)}</h2>${inner}</section>` : "");

  const bullets = (arr) => (arr || []).length ? `<ul>${(arr || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : "";

  const expHtml = (r.experience || []).map((x) => `
    <div class="entry">
      <div class="row"><span class="ttl">${esc(x.title)}</span><span class="dt">${[esc(x.start), esc(x.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[esc(x.company), esc(x.location)].filter(Boolean).join(", ")}</div>
      ${bullets(x.bullets)}
    </div>`).join("");

  const projHtml = (r.projects || []).map((p) => `
    <div class="entry">
      <div class="ttl">${esc(p.name)}</div>
      ${p.description ? `<div class="sub">${esc(p.description)}</div>` : ""}
      ${bullets(p.bullets)}
    </div>`).join("");

  const eduHtml = (r.education || []).map((e) => `
    <div class="entry">
      <div class="row"><span class="ttl">${esc(e.degree)}</span><span class="dt">${[esc(e.start), esc(e.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[esc(e.institution), esc(e.location)].filter(Boolean).join(", ")}</div>
      ${e.details ? `<div class="det">${esc(e.details)}</div>` : ""}
    </div>`).join("");

  const certHtml = (r.certifications || []).length
    ? `<ul>${(r.certifications || []).map((c) => `<li>${esc(c.name)}${[c.issuer, c.year].filter(Boolean).length ? ` <span class="muted">(${[esc(c.issuer), esc(c.year)].filter(Boolean).join(", ")})</span>` : ""}</li>`).join("")}</ul>`
    : "";

  const langHtml = (r.languages || []).length
    ? `<p class="inline">${(r.languages || []).map((l) => `${esc(l.name)}${l.level ? ` <span class="muted">(${esc(l.level)})</span>` : ""}`).join('<span class="sep">•</span>')}</p>`
    : "";

  const tech = r.skills?.technical || [];
  const soft = r.skills?.soft || [];
  const skillsHtml = (tech.length || soft.length)
    ? `${tech.length ? `<p class="inline"><b>${esc(t.tech)}:</b> ${tech.map(esc).join(", ")}</p>` : ""}${soft.length ? `<p class="inline"><b>${esc(t.soft)}:</b> ${soft.map(esc).join(", ")}</p>` : ""}`
    : "";

  const html = `<!DOCTYPE html><html dir="${dir}" lang="${rtl ? "ar" : "en"}"><head><meta charset="utf-8"><title>${esc(name)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${rtl ? '"Cairo", "Segoe UI", Tahoma, Arial, sans-serif' : 'Georgia, "Times New Roman", serif'};
    color: #1a202c; font-size: 10.5pt; line-height: 1.45; direction: ${dir};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header { text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 10px; margin-bottom: 14px; }
  header h1 { font-size: 22pt; margin: 0; letter-spacing: .3px; color: #111827; }
  header .role { font-size: 12pt; color: ${accent}; font-weight: 600; margin-top: 2px; }
  header .contact { font-size: 9pt; color: #4b5563; margin-top: 6px; }
  .sep { margin: 0 6px; color: #cbd5e1; }
  section { margin-bottom: 12px; }
  h2 {
    font-size: 11pt; text-transform: uppercase; letter-spacing: .6px; color: ${accent};
    border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 0 0 6px;
  }
  .entry { margin-bottom: 8px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .ttl { font-weight: 700; font-size: 10.5pt; color: #1a202c; }
  .dt { font-size: 9pt; color: #6b7280; white-space: nowrap; }
  .sub { font-size: 9.5pt; color: #374151; font-style: italic; margin-bottom: 2px; }
  .det, .inline { font-size: 9.5pt; color: #374151; margin: 2px 0; }
  ul { margin: 3px 0 0; padding-${rtl ? "right" : "left"}: 16px; }
  li { margin: 2px 0; font-size: 9.5pt; }
  .muted { color: #6b7280; }
  p { margin: 0 0 3px; }
</style></head><body>
  <header>
    <h1>${esc(r.fullName) || esc(name)}</h1>
    ${r.targetTitle ? `<div class="role">${esc(r.targetTitle)}</div>` : ""}
    ${contact ? `<div class="contact">${contact}</div>` : ""}
  </header>
  ${section(t.summary, r.summary ? `<p>${esc(r.summary)}</p>` : "")}
  ${section(t.skills, skillsHtml)}
  ${section(t.exp, expHtml)}
  ${section(t.proj, projHtml)}
  ${section(t.edu, eduHtml)}
  ${section(t.cert, certHtml)}
  ${section(t.lang, langHtml)}
  ${section(t.ach, bullets(r.achievements))}
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function exportPdf(htmlNode, name) {
  if (!htmlNode) return;
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title>
<style>
  @page { size: A4; margin: 0; }
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { padding: 0; }
  .wrap > div { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
</style></head><body><div class="wrap">${htmlNode.outerHTML}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},350);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`);
  w.document.close();
}
