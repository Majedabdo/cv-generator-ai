import{c as k}from"./index-CzPWWlBZ.js";const E=k("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);const B=k("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);function R(l){return l?`${l}
`:""}function T(l){const t=l?.resume||{};let e="";e+=`${(t.fullName||"").toUpperCase()}
`,t.targetTitle&&(e+=`${t.targetTitle}
`);const o=[t.contact?.email,t.contact?.phone,t.contact?.location,t.contact?.linkedin,t.contact?.portfolio].filter(Boolean).join(" | ");e+=R(o),e+=`
`,t.summary&&(e+=`PROFESSIONAL SUMMARY
${t.summary}

`);const s=t.skills?.technical||[],r=t.skills?.soft||[];if((s.length||r.length)&&(e+=`SKILLS
`,s.length&&(e+=`Technical: ${s.join(", ")}
`),r.length&&(e+=`Soft: ${r.join(", ")}
`),e+=`
`),t.experience?.length){e+=`EXPERIENCE
`;for(const i of t.experience){e+=`${i.title} — ${[i.company,i.location].filter(Boolean).join(", ")} (${[i.start,i.end].filter(Boolean).join(" - ")})
`;for(const c of i.bullets||[])e+=`  - ${c}
`;e+=`
`}}if(t.projects?.length){e+=`PROJECTS
`;for(const i of t.projects){e+=`${i.name}${i.description?` — ${i.description}`:""}
`;for(const c of i.bullets||[])e+=`  - ${c}
`}e+=`
`}if(t.education?.length){e+=`EDUCATION
`;for(const i of t.education)e+=`${i.degree} — ${[i.institution,i.location].filter(Boolean).join(", ")} (${[i.start,i.end].filter(Boolean).join(" - ")})
`,i.details&&(e+=`  ${i.details}
`);e+=`
`}if(t.certifications?.length){e+=`CERTIFICATIONS
`;for(const i of t.certifications)e+=`  - ${i.name}${[i.issuer,i.year].filter(Boolean).length?` (${[i.issuer,i.year].filter(Boolean).join(", ")})`:""}
`;e+=`
`}if(t.languages?.length&&(e+=`LANGUAGES
`,e+=`  ${t.languages.map(i=>`${i.name}${i.level?` (${i.level})`:""}`).join(", ")}

`),t.achievements?.length){e+=`KEY ACHIEVEMENTS
`;for(const i of t.achievements)e+=`  - ${i}
`}return e.trim()+`
`}function z(l,t,e){const o=new Blob([t],{type:e}),s=URL.createObjectURL(o),r=document.createElement("a");r.href=s,r.download=l,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),2e3)}function I(l,t){z(`${t}.txt`,T(l),"text/plain;charset=utf-8")}function M(l,t,e){const o=`<pre>${T(l)}</pre>`,s=`<!DOCTYPE html><html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${t}</title></head><body>${o}</body></html>`;z(`${t}.doc`,s,"application/msword")}function P(l,t){if(!l)return;const e=window.open("","_blank","width=900,height=1200");if(!e)return;const o=d=>String(d??"").replace(/[&<>]/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[p]),{scores:s={},match:r={},missingRequirements:i={},before:c,narrative:m={},industry:f,signals:g={}}=l,y=(d,p)=>{const u=Math.max(0,Math.min(100,p||0)),n=u>=80?"#16a34a":u>=60?"#d97706":"#dc2626";return`<div class="bar"><div class="bl"><span>${o(d)}</span><b style="color:${n}">${u}%</b></div><div class="bt"><div class="bf" style="width:${u}%;background:${n}"></div></div></div>`},h=d=>(d||[]).map(p=>`<span class="chip">${o(typeof p=="string"?p:p.name)}</span>`).join("")||"<i>—</i>",$=d=>(d||[]).map(p=>`<li>${o(typeof p=="string"?p:p.name)}</li>`).join("")||"<li><i>—</i></li>",w=(m.certificationRecommendations||[]).map(d=>`<li><b>${o(d.name)}</b>${d.why?` — ${o(d.why)}`:""}</li>`).join("")||"<li><i>—</i></li>",j=[["Keyword",s.keyword],["Formatting",s.formatting],["Experience",s.experience],["Education",s.education],["Skills",s.skills],["Grammar",s.grammar],["Readability",s.readability],["Job Match",s.jobMatch],["Professionalism",s.professionalism]].map(([d,p])=>y(d,p)).join(""),b=s.overall>=80?"#16a34a":s.overall>=60?"#d97706":"#dc2626",v=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${o(t)} — ATS Report</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 2px solid #7c3aed; padding-bottom: 4px; color: #6d28d9; }
  .muted { color: #64748b; font-size: 12px; }
  .top { display: flex; align-items: center; gap: 20px; margin: 14px 0; }
  .overall { width: 110px; height: 110px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 8px solid ${b}; }
  .overall b { font-size: 32px; color: ${b}; line-height: 1; }
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
  <div class="muted">${o(t)} · Detected industry: <b>${o(f)}</b> · Generated by CVPilot AI</div>
  <div class="top">
    <div class="overall"><b>${s.overall||0}</b><span>OVERALL / 100</span></div>
    <div class="match"><div style="font-size:13px;font-weight:bold">Job Match: ${r.jobMatch||0}%</div><div class="muted" style="margin-top:4px">${o(m.jobMatchReason)}</div></div>
  </div>
  <h2>Detailed ATS Scores</h2>${j}
  ${c?`<h2>Before &amp; After</h2><div class="muted">Original input score: <b>${c.overall}</b> → Optimized resume score: <b style="color:${b}">${s.overall}</b></div>`:""}
  <h2>Keyword Match</h2>
  <div style="font-size:11px;font-weight:bold;color:#16a34a">Matched</div>${h(r.matchedKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#dc2626;margin-top:6px">Missing</div>${h(r.missingKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#d97706;margin-top:6px">Suggested</div>${h(r.suggestedKeywords)}
  <div class="grid2"><div><h2>Strengths</h2><ul>${$(m.strengths)}</ul></div><div><h2>Weaknesses</h2><ul>${$(m.weaknesses)}</ul></div></div>
  <h2>Recommendations</h2><ul>${$(m.recommendations)}</ul>
  <div class="grid2"><div><h2>Priority Improvements</h2><ul>${$(m.priorityImprovements)}</ul></div><div><h2>Quick Wins</h2><ul>${$(m.quickWins)}</ul></div></div>
  <h2>Missing Requirements</h2>
  <div class="muted">Certifications:</div>${h(i.certifications)}
  <div class="muted" style="margin-top:4px">Software:</div>${h(i.software)}
  <div class="muted" style="margin-top:4px">Technologies:</div>${h(i.technologies)}
  <h2>Certification Recommendations</h2><ul>${w}</ul>
  <h2>Career Improvement</h2>
  <div class="muted">Skills to learn:</div>${h(m.careerImprovement?.skillsToLearn)}
  <div class="muted" style="margin-top:4px">Software to learn:</div>${h(m.careerImprovement?.softwareToLearn)}
  <div class="foot">Transparency: analyzed ${g.bulletCount||0} achievement bullets · ${g.actionRatio||0}% start with an action verb · ${g.metricRatio||0}% contain quantified metrics · ${(r.matchedKeywords||[]).length}/${(r.matchedKeywords||[]).length+(r.missingKeywords||[]).length} target keywords matched.</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`;e.document.write(v),e.document.close()}const S=/[\u0600-\u06FF]/;function A(l){const t=l?.resume||{},e=l?.language||l?.locale||t.language||t.locale;if(typeof e=="string"&&/ar|arabic|rtl/i.test(e))return!0;const o=[t.fullName,t.targetTitle,t.summary,...(t.experience||[]).map(s=>`${s.title} ${(s.bullets||[]).join(" ")}`)].join(" ");return S.test(o)}function a(l){return String(l??"").replace(/[&<>]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[t])}function L(l,t,e={}){const o=l?.resume||{},s=A(l),r=s?"rtl":"ltr",i=e.accent||"#6d28d9",c=s?{summary:"الملخص المهني",skills:"المهارات",tech:"المهارات التقنية",soft:"المهارات الشخصية",exp:"الخبرة العملية",proj:"المشاريع",edu:"التعليم",cert:"الشهادات",lang:"اللغات",ach:"أبرز الإنجازات"}:{summary:"Professional Summary",skills:"Skills",tech:"Technical",soft:"Soft Skills",exp:"Professional Experience",proj:"Projects",edu:"Education",cert:"Certifications",lang:"Languages",ach:"Key Achievements"},m=[o.contact?.email,o.contact?.phone,o.contact?.location,o.contact?.linkedin,o.contact?.portfolio].filter(Boolean).map(a).join('<span class="sep">•</span>'),f=(n,x)=>x?`<section><h2>${a(n)}</h2>${x}</section>`:"",g=n=>(n||[]).length?`<ul>${(n||[]).map(x=>`<li>${a(x)}</li>`).join("")}</ul>`:"",y=(o.experience||[]).map(n=>`
    <div class="entry">
      <div class="row"><span class="ttl">${a(n.title)}</span><span class="dt">${[a(n.start),a(n.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[a(n.company),a(n.location)].filter(Boolean).join(", ")}</div>
      ${g(n.bullets)}
    </div>`).join(""),h=(o.projects||[]).map(n=>`
    <div class="entry">
      <div class="ttl">${a(n.name)}</div>
      ${n.description?`<div class="sub">${a(n.description)}</div>`:""}
      ${g(n.bullets)}
    </div>`).join(""),$=(o.education||[]).map(n=>`
    <div class="entry">
      <div class="row"><span class="ttl">${a(n.degree)}</span><span class="dt">${[a(n.start),a(n.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[a(n.institution),a(n.location)].filter(Boolean).join(", ")}</div>
      ${n.details?`<div class="det">${a(n.details)}</div>`:""}
    </div>`).join(""),w=(o.certifications||[]).length?`<ul>${(o.certifications||[]).map(n=>`<li>${a(n.name)}${[n.issuer,n.year].filter(Boolean).length?` <span class="muted">(${[a(n.issuer),a(n.year)].filter(Boolean).join(", ")})</span>`:""}</li>`).join("")}</ul>`:"",j=(o.languages||[]).length?`<p class="inline">${(o.languages||[]).map(n=>`${a(n.name)}${n.level?` <span class="muted">(${a(n.level)})</span>`:""}`).join('<span class="sep">•</span>')}</p>`:"",b=o.skills?.technical||[],v=o.skills?.soft||[],d=b.length||v.length?`${b.length?`<p class="inline"><b>${a(c.tech)}:</b> ${b.map(a).join(", ")}</p>`:""}${v.length?`<p class="inline"><b>${a(c.soft)}:</b> ${v.map(a).join(", ")}</p>`:""}`:"",p=`<!DOCTYPE html><html dir="${r}" lang="${s?"ar":"en"}"><head><meta charset="utf-8"><title>${a(t)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${s?'"Cairo", "Segoe UI", Tahoma, Arial, sans-serif':'Georgia, "Times New Roman", serif'};
    color: #1a202c; font-size: 10.5pt; line-height: 1.45; direction: ${r};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header { text-align: center; border-bottom: 2px solid ${i}; padding-bottom: 10px; margin-bottom: 14px; }
  header h1 { font-size: 22pt; margin: 0; letter-spacing: .3px; color: #111827; }
  header .role { font-size: 12pt; color: ${i}; font-weight: 600; margin-top: 2px; }
  header .contact { font-size: 9pt; color: #4b5563; margin-top: 6px; }
  .sep { margin: 0 6px; color: #cbd5e1; }
  section { margin-bottom: 12px; }
  h2 {
    font-size: 11pt; text-transform: uppercase; letter-spacing: .6px; color: ${i};
    border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 0 0 6px;
  }
  .entry { margin-bottom: 8px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .ttl { font-weight: 700; font-size: 10.5pt; color: #1a202c; }
  .dt { font-size: 9pt; color: #6b7280; white-space: nowrap; }
  .sub { font-size: 9.5pt; color: #374151; font-style: italic; margin-bottom: 2px; }
  .det, .inline { font-size: 9.5pt; color: #374151; margin: 2px 0; }
  ul { margin: 3px 0 0; padding-${s?"right":"left"}: 16px; }
  li { margin: 2px 0; font-size: 9.5pt; }
  .muted { color: #6b7280; }
  p { margin: 0 0 3px; }
</style></head><body>
  <header>
    <h1>${a(o.fullName)||a(t)}</h1>
    ${o.targetTitle?`<div class="role">${a(o.targetTitle)}</div>`:""}
    ${m?`<div class="contact">${m}</div>`:""}
  </header>
  ${f(c.summary,o.summary?`<p>${a(o.summary)}</p>`:"")}
  ${f(c.skills,d)}
  ${f(c.exp,y)}
  ${f(c.proj,h)}
  ${f(c.edu,$)}
  ${f(c.cert,w)}
  ${f(c.lang,j)}
  ${f(c.ach,g(o.achievements))}
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`,u=window.open("","_blank","width=900,height=1200");u&&(u.document.write(p),u.document.close())}export{E as A,B as C,L as a,M as b,I as c,P as e};
