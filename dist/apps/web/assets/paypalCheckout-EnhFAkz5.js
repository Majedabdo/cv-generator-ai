import{c as C,r as v,j as w}from"./index-G-kFfk0v.js";import{i as z}from"./integratedAiClient-BQt49Hx0.js";import{L as A}from"./use-toast-CpBDz1S4.js";const U=C("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);const D=C("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);function I(s){return s?`${s}
`:""}function P(s){const e=s?.resume||{};let t="";t+=`${(e.fullName||"").toUpperCase()}
`,e.targetTitle&&(t+=`${e.targetTitle}
`);const o=[e.contact?.email,e.contact?.phone,e.contact?.location,e.contact?.linkedin,e.contact?.portfolio].filter(Boolean).join(" | ");t+=I(o),t+=`
`,e.summary&&(t+=`PROFESSIONAL SUMMARY
${e.summary}

`);const i=e.skills?.technical||[],l=e.skills?.soft||[];if((i.length||l.length)&&(t+=`SKILLS
`,i.length&&(t+=`Technical: ${i.join(", ")}
`),l.length&&(t+=`Soft: ${l.join(", ")}
`),t+=`
`),e.experience?.length){t+=`EXPERIENCE
`;for(const n of e.experience){t+=`${n.title} — ${[n.company,n.location].filter(Boolean).join(", ")} (${[n.start,n.end].filter(Boolean).join(" - ")})
`;for(const c of n.bullets||[])t+=`  - ${c}
`;t+=`
`}}if(e.projects?.length){t+=`PROJECTS
`;for(const n of e.projects){t+=`${n.name}${n.description?` — ${n.description}`:""}
`;for(const c of n.bullets||[])t+=`  - ${c}
`}t+=`
`}if(e.education?.length){t+=`EDUCATION
`;for(const n of e.education)t+=`${n.degree} — ${[n.institution,n.location].filter(Boolean).join(", ")} (${[n.start,n.end].filter(Boolean).join(" - ")})
`,n.details&&(t+=`  ${n.details}
`);t+=`
`}if(e.certifications?.length){t+=`CERTIFICATIONS
`;for(const n of e.certifications)t+=`  - ${n.name}${[n.issuer,n.year].filter(Boolean).length?` (${[n.issuer,n.year].filter(Boolean).join(", ")})`:""}
`;t+=`
`}if(e.languages?.length&&(t+=`LANGUAGES
`,t+=`  ${e.languages.map(n=>`${n.name}${n.level?` (${n.level})`:""}`).join(", ")}

`),e.achievements?.length){t+=`KEY ACHIEVEMENTS
`;for(const n of e.achievements)t+=`  - ${n}
`}return t.trim()+`
`}function T(s,e,t){const o=new Blob([e],{type:t}),i=URL.createObjectURL(o),l=document.createElement("a");l.href=i,l.download=s,document.body.appendChild(l),l.click(),document.body.removeChild(l),setTimeout(()=>URL.revokeObjectURL(i),2e3)}function H(s,e){T(`${e}.txt`,P(s),"text/plain;charset=utf-8")}function F(s,e,t){const o=`<pre>${P(s)}</pre>`,i=`<!DOCTYPE html><html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${e}</title></head><body>${o}</body></html>`;T(`${e}.doc`,i,"application/msword")}function G(s,e){if(!s)return;const t=window.open("","_blank","width=900,height=1200");if(!t)return;const o=p=>String(p??"").replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[m]),{scores:i={},match:l={},missingRequirements:n={},before:c,narrative:d={},industry:u,signals:f={}}=s,$=(p,m)=>{const g=Math.max(0,Math.min(100,m||0)),a=g>=80?"#16a34a":g>=60?"#d97706":"#dc2626";return`<div class="bar"><div class="bl"><span>${o(p)}</span><b style="color:${a}">${g}%</b></div><div class="bt"><div class="bf" style="width:${g}%;background:${a}"></div></div></div>`},h=p=>(p||[]).map(m=>`<span class="chip">${o(typeof m=="string"?m:m.name)}</span>`).join("")||"<i>—</i>",b=p=>(p||[]).map(m=>`<li>${o(typeof m=="string"?m:m.name)}</li>`).join("")||"<li><i>—</i></li>",S=(d.certificationRecommendations||[]).map(p=>`<li><b>${o(p.name)}</b>${p.why?` — ${o(p.why)}`:""}</li>`).join("")||"<li><i>—</i></li>",R=[["Keyword",i.keyword],["Formatting",i.formatting],["Experience",i.experience],["Education",i.education],["Skills",i.skills],["Grammar",i.grammar],["Readability",i.readability],["Job Match",i.jobMatch],["Professionalism",i.professionalism]].map(([p,m])=>$(p,m)).join(""),y=i.overall>=80?"#16a34a":i.overall>=60?"#d97706":"#dc2626",x=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${o(e)} — ATS Report</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 2px solid #7c3aed; padding-bottom: 4px; color: #6d28d9; }
  .muted { color: #64748b; font-size: 12px; }
  .top { display: flex; align-items: center; gap: 20px; margin: 14px 0; }
  .overall { width: 110px; height: 110px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 8px solid ${y}; }
  .overall b { font-size: 32px; color: ${y}; line-height: 1; }
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
  <div class="muted">${o(e)} · Detected industry: <b>${o(u)}</b> · Generated by CVPilot AI</div>
  <div class="top">
    <div class="overall"><b>${i.overall||0}</b><span>OVERALL / 100</span></div>
    <div class="match"><div style="font-size:13px;font-weight:bold">Job Match: ${l.jobMatch||0}%</div><div class="muted" style="margin-top:4px">${o(d.jobMatchReason)}</div></div>
  </div>
  <h2>Detailed ATS Scores</h2>${R}
  ${c?`<h2>Before &amp; After</h2><div class="muted">Original input score: <b>${c.overall}</b> → Optimized resume score: <b style="color:${y}">${i.overall}</b></div>`:""}
  <h2>Keyword Match</h2>
  <div style="font-size:11px;font-weight:bold;color:#16a34a">Matched</div>${h(l.matchedKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#dc2626;margin-top:6px">Missing</div>${h(l.missingKeywords)}
  <div style="font-size:11px;font-weight:bold;color:#d97706;margin-top:6px">Suggested</div>${h(l.suggestedKeywords)}
  <div class="grid2"><div><h2>Strengths</h2><ul>${b(d.strengths)}</ul></div><div><h2>Weaknesses</h2><ul>${b(d.weaknesses)}</ul></div></div>
  <h2>Recommendations</h2><ul>${b(d.recommendations)}</ul>
  <div class="grid2"><div><h2>Priority Improvements</h2><ul>${b(d.priorityImprovements)}</ul></div><div><h2>Quick Wins</h2><ul>${b(d.quickWins)}</ul></div></div>
  <h2>Missing Requirements</h2>
  <div class="muted">Certifications:</div>${h(n.certifications)}
  <div class="muted" style="margin-top:4px">Software:</div>${h(n.software)}
  <div class="muted" style="margin-top:4px">Technologies:</div>${h(n.technologies)}
  <h2>Certification Recommendations</h2><ul>${S}</ul>
  <h2>Career Improvement</h2>
  <div class="muted">Skills to learn:</div>${h(d.careerImprovement?.skillsToLearn)}
  <div class="muted" style="margin-top:4px">Software to learn:</div>${h(d.careerImprovement?.softwareToLearn)}
  <div class="foot">Transparency: analyzed ${f.bulletCount||0} achievement bullets · ${f.actionRatio||0}% start with an action verb · ${f.metricRatio||0}% contain quantified metrics · ${(l.matchedKeywords||[]).length}/${(l.matchedKeywords||[]).length+(l.missingKeywords||[]).length} target keywords matched.</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`;t.document.write(x),t.document.close()}const B=/[\u0600-\u06FF]/;function L(s){const e=s?.resume||{},t=s?.language||s?.locale||e.language||e.locale;if(typeof t=="string"&&/ar|arabic|rtl/i.test(t))return!0;const o=[e.fullName,e.targetTitle,e.summary,...(e.experience||[]).map(i=>`${i.title} ${(i.bullets||[]).join(" ")}`)].join(" ");return B.test(o)}function r(s){return String(s??"").replace(/[&<>]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[e])}function V(s,e,t={}){const o=s?.resume||{},i=L(s),l=i?"rtl":"ltr",n=t.accent||"#6d28d9",c=i?{summary:"الملخص المهني",skills:"المهارات",tech:"المهارات التقنية",soft:"المهارات الشخصية",exp:"الخبرة العملية",proj:"المشاريع",edu:"التعليم",cert:"الشهادات",lang:"اللغات",ach:"أبرز الإنجازات"}:{summary:"Professional Summary",skills:"Skills",tech:"Technical",soft:"Soft Skills",exp:"Professional Experience",proj:"Projects",edu:"Education",cert:"Certifications",lang:"Languages",ach:"Key Achievements"},d=[o.contact?.email,o.contact?.phone,o.contact?.location,o.contact?.linkedin,o.contact?.portfolio].filter(Boolean).map(r).join('<span class="sep">•</span>'),u=(a,j)=>j?`<section><h2>${r(a)}</h2>${j}</section>`:"",f=a=>(a||[]).length?`<ul>${(a||[]).map(j=>`<li>${r(j)}</li>`).join("")}</ul>`:"",$=(o.experience||[]).map(a=>`
    <div class="entry">
      <div class="row"><span class="ttl">${r(a.title)}</span><span class="dt">${[r(a.start),r(a.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[r(a.company),r(a.location)].filter(Boolean).join(", ")}</div>
      ${f(a.bullets)}
    </div>`).join(""),h=(o.projects||[]).map(a=>`
    <div class="entry">
      <div class="ttl">${r(a.name)}</div>
      ${a.description?`<div class="sub">${r(a.description)}</div>`:""}
      ${f(a.bullets)}
    </div>`).join(""),b=(o.education||[]).map(a=>`
    <div class="entry">
      <div class="row"><span class="ttl">${r(a.degree)}</span><span class="dt">${[r(a.start),r(a.end)].filter(Boolean).join(" – ")}</span></div>
      <div class="sub">${[r(a.institution),r(a.location)].filter(Boolean).join(", ")}</div>
      ${a.details?`<div class="det">${r(a.details)}</div>`:""}
    </div>`).join(""),S=(o.certifications||[]).length?`<ul>${(o.certifications||[]).map(a=>`<li>${r(a.name)}${[a.issuer,a.year].filter(Boolean).length?` <span class="muted">(${[r(a.issuer),r(a.year)].filter(Boolean).join(", ")})</span>`:""}</li>`).join("")}</ul>`:"",R=(o.languages||[]).length?`<p class="inline">${(o.languages||[]).map(a=>`${r(a.name)}${a.level?` <span class="muted">(${r(a.level)})</span>`:""}`).join('<span class="sep">•</span>')}</p>`:"",y=o.skills?.technical||[],x=o.skills?.soft||[],p=y.length||x.length?`${y.length?`<p class="inline"><b>${r(c.tech)}:</b> ${y.map(r).join(", ")}</p>`:""}${x.length?`<p class="inline"><b>${r(c.soft)}:</b> ${x.map(r).join(", ")}</p>`:""}`:"",m=`<!DOCTYPE html><html dir="${l}" lang="${i?"ar":"en"}"><head><meta charset="utf-8"><title>${r(e)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${i?'"Cairo", "Segoe UI", Tahoma, Arial, sans-serif':'Georgia, "Times New Roman", serif'};
    color: #1a202c; font-size: 10.5pt; line-height: 1.45; direction: ${l};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header { text-align: center; border-bottom: 2px solid ${n}; padding-bottom: 10px; margin-bottom: 14px; }
  header h1 { font-size: 22pt; margin: 0; letter-spacing: .3px; color: #111827; }
  header .role { font-size: 12pt; color: ${n}; font-weight: 600; margin-top: 2px; }
  header .contact { font-size: 9pt; color: #4b5563; margin-top: 6px; }
  .sep { margin: 0 6px; color: #cbd5e1; }
  section { margin-bottom: 12px; }
  h2 {
    font-size: 11pt; text-transform: uppercase; letter-spacing: .6px; color: ${n};
    border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin: 0 0 6px;
  }
  .entry { margin-bottom: 8px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .ttl { font-weight: 700; font-size: 10.5pt; color: #1a202c; }
  .dt { font-size: 9pt; color: #6b7280; white-space: nowrap; }
  .sub { font-size: 9.5pt; color: #374151; font-style: italic; margin-bottom: 2px; }
  .det, .inline { font-size: 9.5pt; color: #374151; margin: 2px 0; }
  ul { margin: 3px 0 0; padding-${i?"right":"left"}: 16px; }
  li { margin: 2px 0; font-size: 9.5pt; }
  .muted { color: #6b7280; }
  p { margin: 0 0 3px; }
</style></head><body>
  <header>
    <h1>${r(o.fullName)||r(e)}</h1>
    ${o.targetTitle?`<div class="role">${r(o.targetTitle)}</div>`:""}
    ${d?`<div class="contact">${d}</div>`:""}
  </header>
  ${u(c.summary,o.summary?`<p>${r(o.summary)}</p>`:"")}
  ${u(c.skills,p)}
  ${u(c.exp,$)}
  ${u(c.proj,h)}
  ${u(c.edu,b)}
  ${u(c.cert,S)}
  ${u(c.lang,R)}
  ${u(c.ach,f(o.achievements))}
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};window.onafterprint=function(){window.close();};<\/script>
</body></html>`,g=window.open("","_blank","width=900,height=1200");g&&(g.document.write(m),g.document.close())}let k=null,E="";function N(s,e){const t=`${s}:${e}`;return k&&E===t||(E=t,k=new Promise((o,i)=>{const l=document.getElementById("paypal-sdk");l&&l.remove();const n=document.createElement("script");n.id="paypal-sdk",n.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(s)}&currency=${encodeURIComponent(e)}&intent=capture`,n.onload=()=>window.paypal?o(window.paypal):i(new Error("PayPal SDK unavailable")),n.onerror=()=>i(new Error("Failed to load PayPal SDK")),document.body.appendChild(n)})),k}function Y(){const[s,e]=v.useState({loading:!0,config:null});return v.useEffect(()=>{let t=!0;return z.fetch("/payments/config").then(o=>t&&e({loading:!1,config:o})).catch(()=>t&&e({loading:!1,config:{enabled:!1}})),()=>{t=!1}},[]),s}function _({config:s,onApprove:e,onError:t,disabled:o}){const i=v.useRef(null),[l,n]=v.useState("loading"),c=v.useRef({onApprove:e,onError:t});return c.current={onApprove:e,onError:t},v.useEffect(()=>{if(!s?.enabled||!s?.clientId){n("error");return}let d=!1;return N(s.clientId,s.currency||"USD").then(u=>{d||!i.current||(i.current.innerHTML="",n("ready"),u.Buttons({style:{layout:"vertical",color:"blue",shape:"pill",label:"paypal"},createOrder:(f,$)=>$.order.create({purchase_units:[{amount:{value:String(Number(s.amount||2.69).toFixed(2)),currency_code:s.currency||"USD"},description:"CVPilot resume unlock"}]}),onApprove:async(f,$)=>{try{await $.order.capture(),c.current.onApprove?.(f.orderID)}catch(h){c.current.onError?.(h)}},onError:f=>c.current.onError?.(f)}).render(i.current).catch(()=>!d&&n("error")))}).catch(()=>!d&&n("error")),()=>{d=!0}},[s]),l==="error"?w.jsx("p",{className:"rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive",children:"PayPal is temporarily unavailable. Please try again later."}):w.jsxs("div",{className:"relative",children:[l==="loading"&&w.jsxs("div",{className:"flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground",children:[w.jsx(A,{className:"h-4 w-4 animate-spin"})," Loading PayPal…"]}),w.jsx("div",{ref:i,className:o?"pointer-events-none opacity-50":""})]})}export{U as A,D as C,_ as P,V as a,F as b,H as c,G as e,Y as u};
