import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Sparkles, Wand2, FileText, Download, Lock, Check, Loader2, FileUp,
  Palette, PenLine, Gauge, Files, Plus, Trash2, X, Copy, ShieldCheck as ReviewIcon,
  ShieldCheck, GraduationCap, Briefcase, Rocket, Languages as LangIcon,
  Mail, ShieldCheck as SecureIcon,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { integratedAiClient } from "@/lib/integratedAiClient";
import { toast } from "@/hooks/use-toast";
import {
  TEMPLATES, TEMPLATE_CATEGORIES, FONTS, ACCENTS, ResumePreview,
} from "@/lib/resumeTemplates";
import { exportTxt, exportDocx, exportResumePdf } from "@/lib/resumeExport";
import pb from "@/lib/pocketbaseClient";
import { stripMarker } from "@/lib/resumeSignal";
import AtsReport from "@/components/AtsReport";
import QualityReport from "@/components/QualityReport";
import { writePending } from "@/pages/PaymentPages";
import PayPalCheckout, { usePayPalConfig } from "@/lib/paypalCheckout";

const CHAT_KEY = "cvpilot-chat-session";

const LOADING_STEPS = [
  "Understanding your background",
  "Analyzing the job description",
  "Identifying transferable skills",
  "Rewriting every section professionally",
  "Optimizing for ATS keywords",
  "Scoring your resume",
  "Preparing cover letter & extras",
  "Senior recruiter final quality review",
];

function buildTranscript() {
  try {
    const saved = localStorage.getItem(CHAT_KEY);
    if (!saved) return "";
    const msgs = JSON.parse(saved);
    if (!Array.isArray(msgs)) return "";
    return msgs
      .filter((m) => m.content)
      .map((m) => `${m.role === "user" ? "Candidate" : "Consultant"}: ${stripMarker(m.content)}`)
      .join("\n");
  } catch {
    return "";
  }
}

/* ----------------------------- small UI bits ----------------------------- */

function Field({ label, value, onChange, textarea, rows = 2, placeholder }) {
  const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>}
      {textarea ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={cls} />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

/* ------------------------------ editor panel ----------------------------- */

function Editor({ resume, update }) {
  const setField = (path, val) => update((d) => {
    const r = structuredClone(d.resume);
    let node = r;
    for (let i = 0; i < path.length - 1; i++) node = node[path[i]] ??= {};
    node[path[path.length - 1]] = val;
    return { ...d, resume: r };
  });

  const setList = (key, list) => update((d) => ({ ...d, resume: { ...d.resume, [key]: list } }));
  const commas = (arr) => (arr || []).join(", ");
  const toArr = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-bold">Header & Summary</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={resume.fullName} onChange={(v) => setField(["fullName"], v)} />
          <Field label="Target title" value={resume.targetTitle} onChange={(v) => setField(["targetTitle"], v)} />
          <Field label="Email" value={resume.contact?.email} onChange={(v) => setField(["contact", "email"], v)} />
          <Field label="Phone" value={resume.contact?.phone} onChange={(v) => setField(["contact", "phone"], v)} />
          <Field label="Location" value={resume.contact?.location} onChange={(v) => setField(["contact", "location"], v)} />
          <Field label="LinkedIn" value={resume.contact?.linkedin} onChange={(v) => setField(["contact", "linkedin"], v)} />
          <Field label="Portfolio" value={resume.contact?.portfolio} onChange={(v) => setField(["contact", "portfolio"], v)} />
        </div>
        <Field label="Professional summary" textarea rows={4} value={resume.summary} onChange={(v) => setField(["summary"], v)} />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold">Skills</h4>
        <Field label="Technical (comma separated)" value={commas(resume.skills?.technical)} onChange={(v) => setField(["skills", "technical"], toArr(v))} />
        <Field label="Soft (comma separated)" value={commas(resume.skills?.soft)} onChange={(v) => setField(["skills", "soft"], toArr(v))} />
      </div>

      <ListEditor
        title="Experience" icon={Briefcase} items={resume.experience} onChange={(l) => setList("experience", l)}
        blank={{ title: "", company: "", location: "", start: "", end: "", bullets: [] }}
        render={(item, set) => (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Title" value={item.title} onChange={(v) => set("title", v)} />
              <Field label="Company" value={item.company} onChange={(v) => set("company", v)} />
              <Field label="Location" value={item.location} onChange={(v) => set("location", v)} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start" value={item.start} onChange={(v) => set("start", v)} />
                <Field label="End" value={item.end} onChange={(v) => set("end", v)} />
              </div>
            </div>
            <Field label="Bullets (one per line)" textarea rows={4} value={(item.bullets || []).join("\n")} onChange={(v) => set("bullets", v.split("\n").map((x) => x.trim()).filter(Boolean))} />
          </>
        )}
      />

      <ListEditor
        title="Projects" icon={Rocket} items={resume.projects} onChange={(l) => setList("projects", l)}
        blank={{ name: "", description: "", bullets: [] }}
        render={(item, set) => (
          <>
            <Field label="Name" value={item.name} onChange={(v) => set("name", v)} />
            <Field label="Description" textarea value={item.description} onChange={(v) => set("description", v)} />
            <Field label="Bullets (one per line)" textarea rows={3} value={(item.bullets || []).join("\n")} onChange={(v) => set("bullets", v.split("\n").map((x) => x.trim()).filter(Boolean))} />
          </>
        )}
      />

      <ListEditor
        title="Education" icon={GraduationCap} items={resume.education} onChange={(l) => setList("education", l)}
        blank={{ degree: "", institution: "", location: "", start: "", end: "", details: "" }}
        render={(item, set) => (
          <>
            <Field label="Degree" value={item.degree} onChange={(v) => set("degree", v)} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Institution" value={item.institution} onChange={(v) => set("institution", v)} />
              <Field label="Location" value={item.location} onChange={(v) => set("location", v)} />
              <Field label="Start" value={item.start} onChange={(v) => set("start", v)} />
              <Field label="End" value={item.end} onChange={(v) => set("end", v)} />
            </div>
            <Field label="Details" value={item.details} onChange={(v) => set("details", v)} />
          </>
        )}
      />

      <ListEditor
        title="Certifications" icon={ShieldCheck} items={resume.certifications} onChange={(l) => setList("certifications", l)}
        blank={{ name: "", issuer: "", year: "" }}
        render={(item, set) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Name" value={item.name} onChange={(v) => set("name", v)} />
            <Field label="Issuer" value={item.issuer} onChange={(v) => set("issuer", v)} />
            <Field label="Year" value={item.year} onChange={(v) => set("year", v)} />
          </div>
        )}
      />

      <ListEditor
        title="Languages" icon={LangIcon} items={resume.languages} onChange={(l) => setList("languages", l)}
        blank={{ name: "", level: "" }}
        render={(item, set) => (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Language" value={item.name} onChange={(v) => set("name", v)} />
            <Field label="Level" value={item.level} onChange={(v) => set("level", v)} />
          </div>
        )}
      />

      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" />Achievements</h4>
        <Field label="One per line" textarea rows={4} value={(resume.achievements || []).join("\n")} onChange={(v) => setList("achievements", v.split("\n").map((x) => x.trim()).filter(Boolean))} />
      </div>
    </div>
  );
}

function ListEditor({ title, icon: Icon, items = [], onChange, blank, render }) {
  const list = items || [];
  const setItem = (idx, key, val) => {
    const next = list.map((it, i) => (i === idx ? { ...it, [key]: val } : it));
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4 text-primary" />{title}</h4>
        <button onClick={() => onChange([...list, structuredClone(blank)])} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-secondary">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {list.map((item, idx) => (
        <div key={idx} className="relative space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
          <button onClick={() => onChange(list.filter((_, i) => i !== idx))} className="absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {render(item, (k, v) => setItem(idx, k, v))}
        </div>
      ))}
      {list.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet — click Add.</p>}
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function BuilderPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { isAuthed, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const autoStartedRef = useRef(false);

  const [stage, setStage] = useState("input"); // input | loading | result
  const [candidateInfo, setCandidateInfo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loadStep, setLoadStep] = useState(0);

  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await window.fetch("/hcgi/api/resume/extract", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.text) {
        setCandidateInfo(data.text);
        toast({ title: isAr ? "تم استخراج النص بنجاح" : "Text extracted successfully" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: isAr ? "فشل استخراج النص" : "Extraction failed", description: err.message });
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [bilingual, setBilingual] = useState(null); // { en, ar }
  const [activeLang, setActiveLang] = useState(isAr ? "ar" : "en");
  const bundle = bilingual ? bilingual[activeLang] : null;
  const [tab, setTab] = useState("design");

  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [accent, setAccent] = useState("");
  const [font, setFont] = useState("sans");
  const [spacing, setSpacing] = useState("normal");
  const [tplCategory, setTplCategory] = useState("All");

  const [unlocked, setUnlocked] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);

  const previewRef = useRef(null);
  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0], [templateId]);

  useEffect(() => {
    setCandidateInfo(buildTranscript());
  }, []);

  useEffect(() => {
    if (stage !== "loading") return;
    setLoadStep(0);
    const id = setInterval(() => setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1700);
    return () => clearInterval(id);
  }, [stage]);

  const updateBundle = useCallback(
    (fn) =>
      setBilingual((prev) => {
        if (!prev) return prev;
        return { ...prev, [activeLang]: fn(prev[activeLang]) };
      }),
    [activeLang]
  );

  const generate = useCallback(async () => {
    if (candidateInfo.trim().length < 10) {
      toast({ variant: "destructive", title: isAr ? "أضف معلوماتك" : "Add your details", description: isAr ? "شارك خبرتك أو تحدث مع Pilot أولاً." : "Share your background or chat with Pilot first." });
      return;
    }
    setStage("loading");
    setUnlocked(false);
    try {
      const data = await integratedAiClient.fetch("/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateInfo, jobDescription }),
      });
      if (!data?.en?.resume && !data?.ar?.resume) throw new Error("Generation returned no resume.");
      // Final AI Quality Engine review pass per language — recruiter-grade rewrite + ATS verification.
      const reviewed = {};
      await Promise.all(
        ["en", "ar"].map(async (lg) => {
          const base = data[lg];
          if (!base?.resume) { reviewed[lg] = base || null; return; }
          try {
            const q = await integratedAiClient.fetch("/resume/quality-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bundle: base, jobDescription, originalText: candidateInfo }),
            });
            reviewed[lg] = q?.resume
              ? { ...base, resume: q.resume, scores: { ...(base.scores || {}), ...(q.scores || {}) }, quality: q.quality, atsAnalysis: q.ats }
              : base;
          } catch {
            reviewed[lg] = base;
          }
        })
      );
      // Ensure both keys exist (fall back to the other language if one is missing).
      reviewed.en = reviewed.en || reviewed.ar;
      reviewed.ar = reviewed.ar || reviewed.en;
      setBilingual(reviewed);
      setActiveLang(isAr ? "ar" : "en");
      setStage("result");
      setTab("review");
    } catch (err) {
      setStage("input");
      toast({ variant: "destructive", title: isAr ? "تعذّر التوليد" : "Generation failed", description: err.message });
    }
  }, [candidateInfo, jobDescription, isAr]);

  // Auto-launch generation when the chat hands off with enough information.
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!location.state?.autoGenerate) return;
    if (stage !== "input") return;
    if (candidateInfo.trim().length < 10) return;
    autoStartedRef.current = true;
    generate();
  }, [location.state, stage, candidateInfo, generate]);

  const handleApprove = useCallback(async ({ email, orderId }) => {
    writePending({
      mode: "builder",
      email,
      name: bundle?.resume?.fullName || "",
      contentEn: bilingual?.en || null,
      contentAr: bilingual?.ar || null,
      template: templateId,
      referralCode: (() => { try { return localStorage.getItem("cvpilot-ref") || ""; } catch { return ""; } })(),
    });
    navigate(`/payment-success?order_id=${orderId}`);
  }, [bundle, bilingual, templateId, navigate]);
  const requireUnlock = (fn) => () => {
    if (!unlocked) { setShowPay(true); return; }
    fn();
  };

  const resumeName = (bundle?.resume?.fullName || "resume").replace(/\s+/g, "_");

  /* ------------------------------- INPUT --------------------------------- */
  if (stage === "input") {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground">
        <TopBar />
        <div className="container-page py-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <span className="inline-grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-xl shadow-violet-600/30">
                <Wand2 className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{isAr ? "محرك توليد السيرة الذاتية" : "AI Resume Generation Engine"}</h1>
              <p className="mt-3 text-muted-foreground">
                {isAr
                  ? "سنحوّل معلوماتك إلى سيرة ذاتية احترافية متوافقة مع أنظمة التوظيف — يعيد الذكاء الاصطناعي صياغة كل شيء دون اختلاق."
                  : "We turn your details into a recruiter-grade, ATS-optimized resume. The AI rewrites and optimizes everything — truthfully, never fabricating."}
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{isAr ? "معلوماتك (تم جلبها تلقائياً)" : "Your details (auto-filled)"}</span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <button
                      type="button"
                      disabled={extracting}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-secondary disabled:opacity-50"
                    >
                      {extracting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileUp className="h-3.5 w-3.5" />
                      )}
                      {isAr ? "ارفع ملف السيرة الذاتية مباشرة" : "Upload CV file directly"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={candidateInfo}
                  onChange={(e) => setCandidateInfo(e.target.value)}
                  placeholder={isAr ? "الصق سيرتك القديمة، خبرتك، تعليمك، مهاراتك…" : "Paste your old resume, experience, education, skills, achievements…"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {candidateInfo.trim() ? (isAr ? "جاهز للتوليد." : "Ready to generate.") : (
                  <>{isAr ? "لا توجد محادثة؟ " : "No chat yet? "}<Link to="/chat" className="font-medium text-primary underline">{isAr ? "تحدّث مع Pilot" : "Chat with Pilot"}</Link>{isAr ? " أو الصق معلوماتك أعلاه." : " or paste your info above."}</>
                )}
              </div>
              <Field
                label={isAr ? "الوصف الوظيفي المستهدف (اختياري لكن يُنصح به)" : "Target job description (optional but recommended)"}
                textarea rows={5} value={jobDescription} onChange={setJobDescription}
                placeholder={isAr ? "الصق الوصف الوظيفي أو المتطلبات هنا لتحسين التوافق مع ATS…" : "Paste the job posting or requirements here to optimize ATS keywords…"}
              />
              <button
                onClick={generate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition active:scale-[0.99]"
              >
                <Sparkles className="h-5 w-5" />
                {isAr ? "توليد سيرتي الذاتية" : "Generate my resume"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ LOADING -------------------------------- */
  if (stage === "loading") {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background text-foreground">
        <div className="w-full max-w-md px-6 text-center">
          <motion.span
            className="inline-grid h-20 w-20 place-items-center rounded-3xl gradient-primary text-white shadow-2xl shadow-violet-600/40"
            animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
          >
            <Wand2 className="h-9 w-9" />
          </motion.span>
          <h2 className="mt-8 text-2xl font-bold">{isAr ? "يعمل الذكاء الاصطناعي…" : "Our AI is crafting your resume…"}</h2>
          <div className="mt-8 space-y-3 text-start">
            {LOADING_STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 text-sm transition ${i <= loadStep ? "text-foreground" : "text-muted-foreground/50"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${i < loadStep ? "border-transparent gradient-primary text-white" : i === loadStep ? "border-primary" : "border-border"}`}>
                  {i < loadStep ? <Check className="h-3.5 w-3.5" /> : i === loadStep ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- RESULT -------------------------------- */
  const r = bundle.resume;
  const scores = bundle.scores || {};
  const docs = bundle.documents || {};
  const filteredTemplates = tplCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === tplCategory);

  const TABS = [
    { id: "review", label: isAr ? "المراجعة" : "Review", icon: ReviewIcon },
    { id: "design", label: isAr ? "التصميم" : "Design", icon: Palette },
    { id: "edit", label: isAr ? "تحرير" : "Edit", icon: PenLine },
    { id: "score", label: isAr ? "التحليل" : "Analysis", icon: Gauge },
    { id: "docs", label: isAr ? "مستندات" : "Documents", icon: Files },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <TopBar
        right={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold sm:inline-flex">
              <Gauge className="h-3.5 w-3.5 text-primary" /> ATS {scores.overall ?? "—"}
            </span>
            <ExportButton unlocked={unlocked} onLocked={() => setShowPay(true)} bilingual={bilingual} name={resumeName} isAr={isAr} />
          </div>
        }
      />

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[1fr_460px]">
        {/* preview */}
        <div className="order-2 lg:order-1">
          <div className="lg:sticky lg:top-6">
            <div className="mb-3 inline-flex rounded-xl border border-border bg-card p-1">
              {[["en", "English"], ["ar", "العربية"]].map(([lg, label]) => (
                <button key={lg} onClick={() => setActiveLang(lg)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${activeLang === lg ? "gradient-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:p-6">
              <ResumePreview data={bundle} template={template} accent={accent} font={font} spacing={spacing} forwardRef={previewRef} dir={activeLang === "ar" ? "rtl" : "ltr"} />
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="order-1 lg:order-2">
          <div className="mb-4 flex gap-1 rounded-xl border border-border bg-card p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${tab === t.id ? "gradient-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {tab === "review" && (
              <QualityReport
                quality={bundle.quality}
                atsScore={scores.overall}
                isAr={isAr}
                unlocked={unlocked}
                onUnlock={() => setShowPay(true)}
              />
            )}

            {tab === "design" && (
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 text-sm font-bold">{isAr ? "اللون" : "Accent color"}</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAccent("")} className={`h-8 w-8 rounded-full border-2 text-[9px] font-bold ${accent === "" ? "border-primary" : "border-transparent"}`} style={{ background: template.accent, color: "#fff" }}>A</button>
                    {ACCENTS.map((c) => (
                      <button key={c} onClick={() => setAccent(c)} className={`h-8 w-8 rounded-full border-2 ${accent === c ? "border-primary" : "border-transparent"}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-2 text-sm font-bold">{isAr ? "الخط" : "Font"}</h4>
                    <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
                      {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold">{isAr ? "التباعد" : "Spacing"}</h4>
                    <select value={spacing} onChange={(e) => setSpacing(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
                      <option value="compact">{isAr ? "مضغوط" : "Compact"}</option>
                      <option value="normal">{isAr ? "عادي" : "Normal"}</option>
                      <option value="roomy">{isAr ? "واسع" : "Roomy"}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-bold">{isAr ? "القوالب" : "Templates"} <span className="text-muted-foreground">({TEMPLATES.length})</span></h4>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {["All", ...TEMPLATE_CATEGORIES].map((c) => (
                      <button key={c} onClick={() => setTplCategory(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${tplCategory === c ? "gradient-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {filteredTemplates.map((t) => (
                      <button key={t.id} onClick={() => setTemplateId(t.id)}
                        className={`rounded-xl border p-3 text-start transition ${templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="mb-2 h-10 w-full rounded" style={{ background: `linear-gradient(120deg, ${t.accent}, ${t.accent}bb)` }} />
                        <div className="truncate text-xs font-semibold">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "edit" && <Editor resume={r} update={updateBundle} />}

            {tab === "score" && (
              <AtsReport
                resume={r}
                jobDescription={jobDescription}
                originalText={candidateInfo}
                isAr={isAr}
                unlocked={unlocked}
                onLocked={() => setShowPay(true)}
              />
            )}

            {tab === "docs" && (
              <div className="space-y-4">
                <DocCard title={isAr ? "خطاب التقديم" : "Cover Letter"} text={docs.coverLetter} isAr={isAr} />
                <DocCard title="LinkedIn About" text={docs.linkedinAbout} isAr={isAr} />
                <DocCard title={isAr ? "نبذة احترافية" : "Professional Bio"} text={docs.professionalBio} isAr={isAr} />
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-primary" />{isAr ? "تحضير المقابلة" : "Interview Prep"}</h4>
                  <div className="space-y-2">
                    {(docs.interviewPrep || []).map((q, i) => (
                      <details key={i} className="rounded-xl border border-border bg-secondary/30 p-3">
                        <summary className="cursor-pointer text-sm font-medium">{q.question}</summary>
                        <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>
                      </details>
                    ))}
                    {!(docs.interviewPrep || []).length && <p className="text-xs text-muted-foreground">—</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download lock banner */}
      {!unlocked && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
          <div className="container-page flex flex-col items-center justify-between gap-3 py-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>{isAr ? "افتح تنزيلات PDF و Word مقابل 2.69 دولار (10 ريال)" : "Unlock PDF & Word downloads for $2.69 USD (10 SAR)"}</span>
            </div>
            <button onClick={() => setShowPay(true)} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25">
              <Lock className="h-4 w-4" /> {isAr ? "افتح مقابل 2.69 دولار" : "Unlock for $2.69"}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPay && (
          <PayModal
            isAr={isAr} onClose={() => setShowPay(false)} onApprove={handleApprove}
            authed={isAuthed} defaultEmail={user?.email || ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ sub-components ---------------------------- */

function TopBar({ right }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/50" aria-label="Home">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <Logo />
      </div>
      {right}
    </header>
  );
}

function ExportButton({ unlocked, onLocked, bilingual, name, isAr }) {
  const [open, setOpen] = useState(false);
  const act = (fn) => () => {
    setOpen(false);
    if (!unlocked) { onLocked(); return; }
    fn();
  };
  const groups = [["en", "English", "English"], ["ar", "العربية", "Arabic"]]
    .map(([lg, label, file]) => {
      const b = bilingual?.[lg];
      if (!b?.resume) return null;
      const fn = `${name} - ${file}`;
      return {
        label,
        items: [
          ["PDF", () => exportResumePdf(b, fn)],
          ["DOCX", () => exportDocx(b, fn, null)],
          ["TXT", () => exportTxt(b, fn)],
        ],
      };
    })
    .filter(Boolean);
  return (
    <div className="relative">
      <button onClick={() => (unlocked ? setOpen((o) => !o) : onLocked())}
        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25">
        {unlocked ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {isAr ? "تنزيل" : "Download"}
      </button>
      {open && unlocked && (
        <div className="absolute end-0 z-40 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-xl">
          {groups.map((g) => (
            <div key={g.label} className="mb-1 last:mb-0">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{g.label}</div>
              {g.items.map(([label, fn]) => (
                <button key={label} onClick={act(fn)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                  <FileText className="h-4 w-4 text-primary" /> {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({ title, text, isAr }) {
  const copy = () => {
    navigator.clipboard?.writeText(text || "").then(() =>
      toast({ title: isAr ? "تم النسخ" : "Copied" })
    ).catch(() => {});
  };
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold">{title}</h4>
        <button onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary">
          <Copy className="h-3 w-3" /> {isAr ? "نسخ" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{text || "—"}</p>
    </div>
  );
}

function PayModal({ isAr, onClose, onApprove, authed, defaultEmail }) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [err, setErr] = useState("");
  const emailValid = email && email.includes("@");
  const { loading, config } = usePayPalConfig();

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponErr, setCouponErr] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponErr("");
    try {
      const record = await pb.collection("coupons").getFirstListItem(
        `code="${couponCode.trim().toUpperCase()}" && active=true`
      );
      setCouponApplied(record);
    } catch (_) {
      setCouponErr(isAr ? "كود الخصم غير صالح أو منتهي الصلاحية." : "Invalid or expired promo code.");
      setCouponApplied(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const benefits = isAr
    ? ["نسخة عربية وإنجليزية", "تنزيل PDF و DOCX و TXT للغتين", "تنزيلات غير محدودة", "3 تعديلات بالذكاء الاصطناعي", "حفظ السيرة للأبد"]
    : ["Arabic & English versions", "PDF, DOCX & TXT for both languages", "Unlimited downloads", "3 AI-powered edits", "Saved forever"];

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  // Calculate price displayed
  const originalPrice = 2.69;
  const currentPrice = couponApplied 
    ? (originalPrice * (1 - (couponApplied.percentOff || 0) / 100) - (couponApplied.amountOff || 0))
    : originalPrice;
  const finalPrice = Math.max(0, currentPrice);

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        className="my-8 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-white"><Lock className="h-6 w-6" /></span>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="mt-4 text-2xl font-extrabold">{isAr ? "افتح سيرتك المهنية" : "Unlock your professional resume"}</h3>
        <div className="my-4 flex items-end gap-2">
          <span className="text-4xl font-extrabold gradient-text">${finalPrice.toFixed(2)}</span>
          <span className="pb-1 text-sm text-muted-foreground">
            {isAr 
              ? `USD (${Math.round(finalPrice * 3.75)} ريال) · دفعة واحدة` 
              : `USD (${Math.round(finalPrice * 3.75)} SAR) · one-time`}
            {couponApplied && <span className="ms-2 text-green-500 font-bold">({isAr ? "خصم مطبق" : "Discount applied"})</span>}
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-green-500" />{b}</li>
          ))}
        </ul>

        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{isAr ? "البريد الإلكتروني (لإنشاء حسابك)" : "Email (we'll create your account)"}</label>
          <div className="relative"><Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={authed} placeholder="you@email.com" className={`${inp} ps-9`} />
          </div>
        </div>

        {emailValid && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{isAr ? "كوبون الخصم" : "Promo Code"}</label>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder={isAr ? "أدخل كود الخصم" : "Enter promo code"} className={`${inp} uppercase`} disabled={checkingCoupon || !!couponApplied} />
              <button onClick={handleApplyCoupon} disabled={checkingCoupon || !couponCode.trim() || !!couponApplied} className="rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "تطبيق" : "Apply")}
              </button>
            </div>
            {couponApplied && <p className="mt-1 text-xs text-green-500">{isAr ? "تم تطبيق الكوبون بنجاح!" : "Coupon applied successfully!"}</p>}
            {couponErr && <p className="mt-1 text-xs text-destructive">{couponErr}</p>}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">{isAr ? "خيارات الدفع والاشتراك" : "Payment & subscription options"}</label>
          {emailValid ? (
            couponApplied?.percentOff === 100 || finalPrice <= 0 ? (
              <button 
                onClick={() => onApprove({ email, orderId: "SANDBOX_COUPON_" + (couponApplied?.code || "FREE") })} 
                className="mt-2 w-full rounded-xl gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 active:scale-95 transition"
              >
                {isAr ? "تفعيل مجاني وكامل للخدمة" : "Activate Free & Full Access"}
              </button>
            ) : config?.enabled ? (
              <div className="mt-2 min-h-[150px]">
                <PayPalCheckout
                  config={couponApplied ? { ...config, amount: finalPrice } : config}
                  onApprove={(orderId) => onApprove({ email, orderId })}
                  onError={(e) => setErr(e.message || "Payment failed")}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/35 p-6 text-center text-xs text-muted-foreground">
                {isAr ? "بوابة الدفع غير متاحة حالياً." : "Payment gateway is temporarily unavailable."}
              </div>
            )
          ) : (
            <div className="rounded-xl border border-border bg-secondary/35 p-6 text-center text-xs text-muted-foreground">
              {isAr ? "أدخل بريداً إلكترونياً صحيحاً لإظهار خيارات الدفع والبطاقات." : "Enter a valid email to show payment & card options."}
            </div>
          )}
        </div>

        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <SecureIcon className="h-3.5 w-3.5 text-green-500" />
          {isAr ? "دفع آمن ومشفّر عبر SSL — متوافق مع PCI." : "Encrypted, SSL-secured checkout — PCI compliant."}
        </p>
      </motion.div>
    </motion.div>
  );
}
