import React from "react";

/* ------------------------------------------------------------------ */
/* Template catalogue (32 premium templates across 12 categories)      */
/* layout ∈ 'single' | 'sidebar' | 'banner'                            */
/* ------------------------------------------------------------------ */

export const FONTS = [
  { id: "sans", label: "Inter (Sans)", css: "'Inter', system-ui, sans-serif" },
  { id: "grotesk", label: "Jakarta (Grotesk)", css: "'Plus Jakarta Sans', sans-serif" },
  { id: "serif", label: "Georgia (Serif)", css: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

export const ACCENTS = [
  "#4f46e5", "#7c3aed", "#0ea5e9", "#0f766e", "#b91c1c",
  "#c2410c", "#065f46", "#1e293b", "#be185d", "#a16207",
];

export const TEMPLATES = [
  { id: "corporate-classic", name: "Corporate Classic", category: "Corporate", layout: "single", accent: "#1e293b" },
  { id: "corporate-bold", name: "Corporate Bold", category: "Corporate", layout: "banner", accent: "#1e293b" },
  { id: "corporate-slate", name: "Corporate Slate", category: "Corporate", layout: "sidebar", accent: "#334155" },
  { id: "corporate-metro", name: "Corporate Metro", category: "Corporate", layout: "single", accent: "#0f172a" },
  { id: "executive-prestige", name: "Executive Prestige", category: "Executive", layout: "banner", accent: "#111827" },
  { id: "executive-noir", name: "Executive Noir", category: "Executive", layout: "sidebar", accent: "#0b1020" },
  { id: "executive-platinum", name: "Executive Platinum", category: "Executive", layout: "single", accent: "#374151" },
  { id: "minimal-mono", name: "Minimal Mono", category: "Minimal", layout: "single", accent: "#111827" },
  { id: "minimal-air", name: "Minimal Air", category: "Minimal", layout: "single", accent: "#475569" },
  { id: "minimal-line", name: "Minimal Line", category: "Minimal", layout: "single", accent: "#0f766e" },
  { id: "minimal-ivory", name: "Minimal Ivory", category: "Minimal", layout: "sidebar", accent: "#78716c" },
  { id: "modern-edge", name: "Modern Edge", category: "Modern", layout: "sidebar", accent: "#4f46e5" },
  { id: "modern-flow", name: "Modern Flow", category: "Modern", layout: "banner", accent: "#7c3aed" },
  { id: "modern-grid", name: "Modern Grid", category: "Modern", layout: "single", accent: "#0ea5e9" },
  { id: "modern-aurora", name: "Modern Aurora", category: "Modern", layout: "sidebar", accent: "#6366f1" },
  { id: "creative-spark", name: "Creative Spark", category: "Creative", layout: "sidebar", accent: "#be185d" },
  { id: "creative-studio", name: "Creative Studio", category: "Creative", layout: "banner", accent: "#c026d3" },
  { id: "creative-canvas", name: "Creative Canvas", category: "Creative", layout: "banner", accent: "#db2777" },
  { id: "healthcare-care", name: "Healthcare Care", category: "Healthcare", layout: "sidebar", accent: "#0d9488" },
  { id: "healthcare-clinic", name: "Healthcare Clinic", category: "Healthcare", layout: "single", accent: "#0891b2" },
  { id: "engineering-build", name: "Engineering Build", category: "Engineering", layout: "single", accent: "#c2410c" },
  { id: "engineering-precision", name: "Engineering Precision", category: "Engineering", layout: "sidebar", accent: "#b45309" },
  { id: "finance-trust", name: "Finance Trust", category: "Finance", layout: "banner", accent: "#065f46" },
  { id: "finance-capital", name: "Finance Capital", category: "Finance", layout: "single", accent: "#166534" },
  { id: "it-stack", name: "IT Stack", category: "IT", layout: "sidebar", accent: "#2563eb" },
  { id: "it-cloud", name: "IT Cloud", category: "IT", layout: "single", accent: "#0284c7" },
  { id: "sales-driver", name: "Sales Driver", category: "Sales", layout: "banner", accent: "#b91c1c" },
  { id: "sales-peak", name: "Sales Peak", category: "Sales", layout: "single", accent: "#dc2626" },
  { id: "marketing-pulse", name: "Marketing Pulse", category: "Marketing", layout: "sidebar", accent: "#9333ea" },
  { id: "marketing-brand", name: "Marketing Brand", category: "Marketing", layout: "banner", accent: "#7c3aed" },
  { id: "education-scholar", name: "Education Scholar", category: "Education", layout: "single", accent: "#a16207" },
  { id: "education-mentor", name: "Education Mentor", category: "Education", layout: "sidebar", accent: "#0f766e" },
];

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

/* ------------------------------------------------------------------ */
/* Rendering helpers                                                   */
/* ------------------------------------------------------------------ */

const SPACING = { compact: 0.78, normal: 1, roomy: 1.25 };

function dateRange(a, b) {
  const s = (a || "").trim();
  const e = (b || "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function has(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

function SectionTitle({ children, accent, style }) {
  return (
    <h3
      style={{
        color: accent,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        margin: "0 0 8px",
        borderBottom: style === "line" ? `2px solid ${accent}` : "none",
        paddingBottom: style === "line" ? 3 : 0,
      }}
    >
      {children}
    </h3>
  );
}

function Bullets({ items }) {
  if (!has(items)) return null;
  return (
    <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
      {items.map((b, i) => (
        <li key={i} style={{ marginBottom: 3, lineHeight: 1.5 }}>{b}</li>
      ))}
    </ul>
  );
}

function ExperienceBlock({ data, accent }) {
  if (!has(data.experience)) return null;
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent} style="line">Experience</SectionTitle>
      {data.experience.map((x, i) => (
        <div key={i} style={{ marginBottom: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ fontSize: 13.5 }}>{x.title}</strong>
            <span style={{ fontSize: 11.5, color: "#555", whiteSpace: "nowrap" }}>{dateRange(x.start, x.end)}</span>
          </div>
          <div style={{ fontSize: 12.5, color: accent, fontWeight: 600 }}>
            {[x.company, x.location].filter(Boolean).join(" · ")}
          </div>
          <Bullets items={x.bullets} />
        </div>
      ))}
    </section>
  );
}

function ProjectsBlock({ data, accent }) {
  if (!has(data.projects)) return null;
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent} style="line">Projects</SectionTitle>
      {data.projects.map((p, i) => (
        <div key={i} style={{ marginBottom: 9 }}>
          <strong style={{ fontSize: 13 }}>{p.name}</strong>
          {p.description && <div style={{ fontSize: 12.5, marginTop: 2 }}>{p.description}</div>}
          <Bullets items={p.bullets} />
        </div>
      ))}
    </section>
  );
}

function EducationBlock({ data, accent }) {
  if (!has(data.education)) return null;
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent} style="line">Education</SectionTitle>
      {data.education.map((e, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ fontSize: 13 }}>{e.degree}</strong>
            <span style={{ fontSize: 11.5, color: "#555", whiteSpace: "nowrap" }}>{dateRange(e.start, e.end)}</span>
          </div>
          <div style={{ fontSize: 12.5, color: accent }}>{[e.institution, e.location].filter(Boolean).join(" · ")}</div>
          {e.details && <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{e.details}</div>}
        </div>
      ))}
    </section>
  );
}

function AchievementsBlock({ data, accent }) {
  if (!has(data.achievements)) return null;
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent} style="line">Key Achievements</SectionTitle>
      <Bullets items={data.achievements} />
    </section>
  );
}

function CertsBlock({ data, accent, inSidebar }) {
  if (!has(data.certifications)) return null;
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={inSidebar ? "#fff" : accent} style={inSidebar ? "" : "line"}>Certifications</SectionTitle>
      {data.certifications.map((c, i) => (
        <div key={i} style={{ fontSize: 12, marginBottom: 5 }}>
          <div style={{ fontWeight: 600 }}>{c.name}</div>
          <div style={{ opacity: 0.85 }}>{[c.issuer, c.year].filter(Boolean).join(" · ")}</div>
        </div>
      ))}
    </section>
  );
}

function SkillsInline({ data, accent }) {
  const tech = data.skills?.technical || [];
  const soft = data.skills?.soft || [];
  if (!tech.length && !soft.length) return null;
  const Chip = ({ label }) => (
    <span style={{ fontSize: 11.5, background: `${accent}15`, color: accent, padding: "3px 9px", borderRadius: 6, fontWeight: 600 }}>{label}</span>
  );
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent} style="line">Skills</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tech.map((s, i) => <Chip key={`t${i}`} label={s} />)}
        {soft.map((s, i) => <Chip key={`s${i}`} label={s} />)}
      </div>
    </section>
  );
}

function SidebarList({ title, items, render }) {
  if (!has(items)) return null;
  return (
    <section style={{ marginBottom: 18 }}>
      <h3 style={{ color: "#fff", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{title}</h3>
      <div style={{ color: "rgba(255,255,255,0.9)" }}>{items.map(render)}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main preview                                                        */
/* ------------------------------------------------------------------ */

export function ResumePreview({ data, template, accent, font, spacing, forwardRef, dir = "ltr" }) {
  const tpl = template || TEMPLATES[0];
  const ac = accent || tpl.accent;
  const fam = (FONTS.find((f) => f.id === font) || FONTS[0]).css;
  const sp = SPACING[spacing] || 1;
  const r = data?.resume || {};

  const base = {
    fontFamily: fam,
    color: "#1f2937",
    background: "#ffffff",
    fontSize: 13 * sp,
    lineHeight: 1.5,
    width: "100%",
    maxWidth: 820,
    margin: "0 auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    borderRadius: 6,
    overflow: "hidden",
    direction: dir,
    textAlign: dir === "rtl" ? "right" : "left",
  };

  const contactLine = [r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin, r.contact?.portfolio]
    .filter(Boolean).join("  •  ");

  const Header = ({ variant }) => {
    if (variant === "banner") {
      return (
        <div style={{ background: ac, color: "#fff", padding: `${26 * sp}px 34px` }}>
          <h1 style={{ margin: 0, fontSize: 27 * sp, fontWeight: 800 }}>{r.fullName || "Your Name"}</h1>
          {r.targetTitle && <div style={{ marginTop: 4, fontSize: 14 * sp, opacity: 0.92, fontWeight: 500 }}>{r.targetTitle}</div>}
          {contactLine && <div style={{ marginTop: 10, fontSize: 11.5, opacity: 0.9 }}>{contactLine}</div>}
        </div>
      );
    }
    return (
      <div style={{ padding: "28px 34px 0" }}>
        <h1 style={{ margin: 0, fontSize: 27 * sp, fontWeight: 800, color: "#111827" }}>{r.fullName || "Your Name"}</h1>
        {r.targetTitle && <div style={{ marginTop: 3, fontSize: 14.5 * sp, color: ac, fontWeight: 600 }}>{r.targetTitle}</div>}
        {contactLine && <div style={{ marginTop: 9, fontSize: 11.5, color: "#555" }}>{contactLine}</div>}
        <div style={{ height: 3, background: ac, marginTop: 12, borderRadius: 2 }} />
      </div>
    );
  };

  const Summary = () =>
    r.summary ? (
      <section style={{ marginBottom: 16 }}>
        <SectionTitle accent={ac} style="line">Professional Summary</SectionTitle>
        <p style={{ margin: 0, lineHeight: 1.55 }}>{r.summary}</p>
      </section>
    ) : null;

  /* -------------------- SIDEBAR LAYOUT -------------------- */
  if (tpl.layout === "sidebar") {
    return (
      <div ref={forwardRef} dir={dir} style={base}>
        <div style={{ display: "flex", minHeight: 900 }}>
          <aside style={{ width: "34%", background: ac, color: "#fff", padding: `28px 22px` }}>
            <h1 style={{ margin: 0, fontSize: 22 * sp, fontWeight: 800, lineHeight: 1.15 }}>{r.fullName || "Your Name"}</h1>
            {r.targetTitle && <div style={{ marginTop: 5, fontSize: 12.5 * sp, opacity: 0.9 }}>{r.targetTitle}</div>}
            <div style={{ height: 1, background: "rgba(255,255,255,0.25)", margin: "16px 0" }} />
            <SidebarList
              title="Contact"
              items={[r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin, r.contact?.portfolio].filter(Boolean)}
              render={(c, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 5, wordBreak: "break-word" }}>{c}</div>}
            />
            <SidebarList
              title="Technical Skills"
              items={r.skills?.technical}
              render={(s, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 4 }}>{s}</div>}
            />
            <SidebarList
              title="Soft Skills"
              items={r.skills?.soft}
              render={(s, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 4 }}>{s}</div>}
            />
            <SidebarList
              title="Languages"
              items={r.languages}
              render={(l, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 4 }}>{l.name}{l.level ? ` — ${l.level}` : ""}</div>}
            />
            <CertsBlock data={r} accent={ac} inSidebar />
          </aside>
          <main style={{ width: "66%", padding: "28px 26px" }}>
            <Summary />
            <ExperienceBlock data={r} accent={ac} />
            <ProjectsBlock data={r} accent={ac} />
            <EducationBlock data={r} accent={ac} />
            <AchievementsBlock data={r} accent={ac} />
          </main>
        </div>
      </div>
    );
  }

  /* -------------------- SINGLE / BANNER LAYOUT -------------------- */
  return (
    <div ref={forwardRef} dir={dir} style={base}>
      <Header variant={tpl.layout === "banner" ? "banner" : "single"} />
      <div style={{ padding: "20px 34px 34px" }}>
        <Summary />
        <SkillsInline data={r} accent={ac} />
        <ExperienceBlock data={r} accent={ac} />
        <ProjectsBlock data={r} accent={ac} />
        <EducationBlock data={r} accent={ac} />
        {has(r.certifications) && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle accent={ac} style="line">Certifications</SectionTitle>
            {r.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 12.5, marginBottom: 4 }}>
                <strong>{c.name}</strong>{[c.issuer, c.year].filter(Boolean).length ? ` — ${[c.issuer, c.year].filter(Boolean).join(", ")}` : ""}
              </div>
            ))}
          </section>
        )}
        {has(r.languages) && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle accent={ac} style="line">Languages</SectionTitle>
            <div style={{ fontSize: 12.5 }}>{r.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`).join("  •  ")}</div>
          </section>
        )}
        <AchievementsBlock data={r} accent={ac} />
      </div>
    </div>
  );
}
