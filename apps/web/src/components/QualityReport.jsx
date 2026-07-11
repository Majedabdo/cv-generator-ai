import React from "react";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Sparkles,
  ThumbsUp, ThumbsDown, Lightbulb, Wand2, HelpCircle, Gauge, Lock,
} from "lucide-react";

function ScoreRing({ value, label, isAr }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = v >= 80 ? "#22c55e" : v >= 60 ? "#eab308" : "#ef4444";
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-2xl font-extrabold">{v}</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

const STATUS = {
  pass: { icon: CheckCircle2, cls: "text-green-500" },
  warn: { icon: AlertTriangle, cls: "text-yellow-500" },
  fail: { icon: XCircle, cls: "text-red-500" },
};

function List({ icon: Icon, title, items, tone }) {
  if (!items || !items.length) return null;
  const toneCls = tone === "good" ? "text-green-500" : tone === "bad" ? "text-red-500" : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <h5 className={`mb-2 flex items-center gap-2 text-sm font-bold`}>
        <Icon className={`h-4 w-4 ${toneCls}`} /> {title}
      </h5>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "good" ? "bg-green-500" : tone === "bad" ? "bg-red-500" : "bg-primary"}`} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function QualityReport({ quality, atsScore, isAr, onUnlock, unlocked }) {
  if (!quality) {
    return (
      <div className="grid place-items-center py-10 text-center text-sm text-muted-foreground">
        <ShieldCheck className="mb-2 h-8 w-8 text-muted-foreground/50" />
        {isAr ? "لم تتم مراجعة الجودة بعد." : "Quality review not available yet."}
      </div>
    );
  }

  const q = quality;
  const checks = q.checks || [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="h-5 w-5" />
          {isAr ? "مراجعة خبير التوظيف (20+ سنة خبرة)" : "Reviewed by a 20+ year Senior Recruiter"}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-around gap-4">
          <ScoreRing value={q.overallQuality} label={isAr ? "جودة السيرة" : "Resume Quality"} isAr={isAr} />
          <ScoreRing value={atsScore ?? q.atsScore} label={isAr ? "درجة ATS" : "ATS Score"} isAr={isAr} />
        </div>
        {q.verdict && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-background/60 px-3 py-2.5 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="italic">“{q.verdict}”</span>
          </p>
        )}
      </div>

      {checks.length > 0 && (
        <div>
          <h5 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Gauge className="h-4 w-4 text-primary" /> {isAr ? "قائمة فحص الجودة" : "Quality Checklist"}
          </h5>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {checks.map((c, i) => {
              const s = STATUS[c.status] || STATUS.pass;
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.cls}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{c.name}</div>
                    {c.note && <div className="truncate text-[11px] text-muted-foreground">{c.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <List icon={ThumbsUp} title={isAr ? "نقاط القوة" : "Strengths"} items={q.strengths} tone="good" />
        <List icon={ThumbsDown} title={isAr ? "نقاط الضعف" : "Weaknesses"} items={q.weaknesses} tone="bad" />
      </div>

      <List icon={Lightbulb} title={isAr ? "اقتراحات للتحسين" : "Suggestions"} items={q.suggestions} />
      <List icon={Wand2} title={isAr ? "التحسينات التي تم تطبيقها" : "Improvements Applied by the AI"} items={q.changesMade} tone="good" />

      {(q.questionsForUser || []).length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <h5 className="mb-2 flex items-center gap-2 text-sm font-bold text-yellow-600 dark:text-yellow-400">
            <HelpCircle className="h-4 w-4" /> {isAr ? "معلومات ناقصة (لن نخترعها)" : "Missing info — we won't invent it"}
          </h5>
          <ul className="space-y-1.5">
            {q.questionsForUser.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />{t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {isAr ? "أضف هذه التفاصيل في تبويب التحرير لتحسين سيرتك." : "Add these in the Edit tab to strengthen your resume."}
          </p>
        </div>
      )}

      {!unlocked && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-center">
          <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-green-500" />
          <p className="text-sm font-semibold">
            {isAr ? "سيرتك جاهزة للتنزيل بعد الدفع" : "Your resume is review-approved and ready"}
          </p>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            {isAr ? "تمت المراجعة النهائية للجودة و ATS. افتح التنزيل الآن." : "Final quality & ATS review complete. Unlock download to continue."}
          </p>
          <button onClick={onUnlock}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25">
            <Lock className="h-4 w-4" /> {isAr ? "افتح بـ 10 ريال" : "Unlock for 10 SAR"}
          </button>
        </div>
      )}
    </div>
  );
}
