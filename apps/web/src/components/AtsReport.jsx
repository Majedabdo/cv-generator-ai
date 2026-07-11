import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import {
  Gauge, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Target,
  Zap, TrendingUp, Award, GraduationCap, Cpu, ShieldCheck, Loader2,
  RefreshCw, ArrowRight, Building2, Lock, FileDown,
} from "lucide-react";
import { integratedAiClient } from "@/lib/integratedAiClient";
import { exportAtsReportPdf } from "@/lib/resumeExport";

function scoreColor(v) {
  if (v >= 80) return "#16a34a";
  if (v >= 60) return "#d97706";
  return "#dc2626";
}
function scoreLabel(v, isAr) {
  if (v >= 85) return isAr ? "ممتاز" : "Excellent";
  if (v >= 70) return isAr ? "جيد" : "Good";
  if (v >= 55) return isAr ? "متوسط" : "Fair";
  return isAr ? "يحتاج تحسيناً" : "Needs work";
}

function BigScore({ value, isAr }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const size = 150;
  const stroke = 12;
  const rad = (size - stroke) / 2;
  const circ = 2 * Math.PI * rad;
  const color = scoreColor(v);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={rad} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={rad} stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (v / 100) * circ }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>{v}</span>
          <span className="text-[11px] font-medium text-muted-foreground">{isAr ? "من 100" : "of 100"}</span>
        </div>
      </div>
      <span className="mt-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${color}1a`, color }}>
        {scoreLabel(v, isAr)}
      </span>
    </div>
  );
}

function Bar100({ label, value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color = scoreColor(v);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{v}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, tone = "primary" }) {
  const toneCls = {
    primary: "text-primary",
    green: "text-green-500",
    amber: "text-amber-500",
    red: "text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Icon className={`h-4 w-4 ${toneCls}`} />{title}
      </h4>
      {children}
    </div>
  );
}

function Chips({ items, tone = "secondary" }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">—</p>;
  const cls = {
    secondary: "bg-secondary text-foreground",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-destructive/10 text-destructive",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }[tone];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => <span key={i} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${cls}`}>{it}</span>)}
    </div>
  );
}

function BulletList({ items, icon: Icon, tone = "primary" }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">—</p>;
  const toneCls = { primary: "text-primary", green: "text-green-500", amber: "text-amber-500", red: "text-destructive" }[tone];
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${toneCls}`} />
          <span className="text-muted-foreground">{typeof it === "string" ? it : it.name}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AtsReport({ resume, jobDescription, originalText, isAr, unlocked, onLocked }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await integratedAiClient.fetch("/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription, originalText }),
      });
      setData(result);
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [resume, jobDescription, originalText]);

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{isAr ? "يحلّل محرك ATS سيرتك…" : "Running deep ATS analysis…"}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-3 text-sm">{isAr ? "تعذّر إجراء التحليل." : "Could not run the analysis."}</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <button onClick={run} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          <RefreshCw className="h-4 w-4" /> {isAr ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { scores, match, missingRequirements, visualization, before, improvements, narrative, industry, signals } = data;

  const radarData = [
    { metric: isAr ? "الكلمات" : "Keywords", v: visualization.keywordCoverage },
    { metric: isAr ? "المهارات" : "Skills", v: visualization.skillsMatch },
    { metric: isAr ? "الخبرة" : "Experience", v: visualization.experienceMatch },
    { metric: isAr ? "التعليم" : "Education", v: visualization.educationMatch },
    { metric: isAr ? "التنسيق" : "Formatting", v: visualization.formatting },
    { metric: isAr ? "القواعد" : "Grammar", v: visualization.grammar },
  ];

  const scoreBars = [
    [isAr ? "الكلمات المفتاحية" : "Keyword", scores.keyword],
    [isAr ? "التنسيق" : "Formatting", scores.formatting],
    [isAr ? "الخبرة" : "Experience", scores.experience],
    [isAr ? "التعليم" : "Education", scores.education],
    [isAr ? "المهارات" : "Skills", scores.skills],
    [isAr ? "القواعد" : "Grammar", scores.grammar],
    [isAr ? "القراءة" : "Readability", scores.readability],
    [isAr ? "توافق الوظيفة" : "Job Match", scores.jobMatch],
    [isAr ? "الاحترافية" : "Professionalism", scores.professionalism],
  ];

  const beforeAfter = before
    ? [
        { name: isAr ? "قبل" : "Original", value: before.overall },
        { name: isAr ? "بعد" : "Optimized", value: scores.overall },
      ]
    : null;

  return (
    <div className="space-y-5">
      {/* header + overall + job match */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <Gauge className="h-5 w-5 text-primary" /> {isAr ? "تقرير تحليل ATS" : "ATS Analysis Report"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {isAr ? "المجال المكتشف" : "Detected industry"}: <span className="font-semibold text-foreground">{industry}</span>
            </p>
          </div>
          <button
            onClick={() => (unlocked ? exportAtsReportPdf(data, resume?.fullName || "ATS-Report") : onLocked?.())}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
          >
            {unlocked ? <FileDown className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
            {isAr ? "تنزيل التقرير PDF" : "Download PDF report"}
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <BigScore value={scores.overall} isAr={isAr} />
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{isAr ? "توافق الوظيفة" : "Job Match"}</span>
              <span className="ml-auto text-xl font-extrabold" style={{ color: scoreColor(match.jobMatch) }}>{match.jobMatch}%</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{narrative?.jobMatchReason}</p>
            {narrative?.jobMatchHighlights?.length > 0 && (
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {narrative.jobMatchHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* visualization: radar + score bars */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={TrendingUp} title={isAr ? "خريطة التوافق" : "ATS Coverage Map"}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Radar dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section icon={Gauge} title={isAr ? "درجات ATS التفصيلية" : "Detailed ATS Scores"}>
          <div className="space-y-3">
            {scoreBars.map(([label, v]) => <Bar100 key={label} label={label} value={v} />)}
          </div>
        </Section>
      </div>

      {/* before & after */}
      {beforeAfter && (
        <Section icon={Zap} title={isAr ? "قبل وبعد التحسين" : "Before & After Optimization"}>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beforeAfter} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={70} />
                  <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={26} label={{ position: "right", fill: "hsl(var(--foreground))", fontSize: 12 }}>
                    {beforeAfter.map((d, i) => <Cell key={i} fill={i === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:content-center">
              <Metric label={isAr ? "كلمات مضافة" : "Keywords added"} value={`+${improvements.keywordsAdded}`} />
              {improvements.atsImproved != null && <Metric label={isAr ? "تحسّن ATS" : "ATS improved"} value={`+${improvements.atsImproved}`} />}
              {improvements.formattingImproved != null && <Metric label={isAr ? "تحسّن التنسيق" : "Formatting"} value={`+${improvements.formattingImproved}`} />}
              <Metric label={isAr ? "درجة القواعد" : "Grammar score"} value={improvements.grammarImproved} />
            </div>
          </div>
        </Section>
      )}

      {/* match analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={CheckCircle2} title={isAr ? "كلمات متطابقة" : "Matched Keywords"} tone="green">
          <Chips items={match.matchedKeywords} tone="green" />
        </Section>
        <Section icon={AlertTriangle} title={isAr ? "كلمات ناقصة" : "Missing Keywords"} tone="red">
          <Chips items={match.missingKeywords} tone="red" />
        </Section>
        <Section icon={Sparkles} title={isAr ? "كلمات مقترحة" : "Suggested Keywords"} tone="amber">
          <Chips items={match.suggestedKeywords} tone="amber" />
        </Section>
        <Section icon={ShieldCheck} title={isAr ? "مهارات ذات صلة" : "Relevant Skills"} tone="green">
          <Chips items={match.relevantSkills} tone="green" />
        </Section>
      </div>

      {/* missing requirements */}
      <Section icon={AlertTriangle} title={isAr ? "المتطلبات الناقصة" : "Missing Requirements"} tone="amber">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MiniList title={isAr ? "شهادات" : "Certifications"} items={missingRequirements.certifications} icon={Award} />
          <MiniList title={isAr ? "مهارات" : "Skills"} items={missingRequirements.skills} icon={Sparkles} />
          <MiniList title={isAr ? "برامج" : "Software"} items={missingRequirements.software} icon={Cpu} />
          <MiniList title={isAr ? "تقنيات" : "Technologies"} items={missingRequirements.technologies} icon={Cpu} />
          <MiniList title={isAr ? "مصطلحات المجال" : "Industry Terms"} items={missingRequirements.industryTerms} icon={Building2} />
          <MiniList title={isAr ? "خبرة" : "Experience"} items={missingRequirements.experience} icon={TrendingUp} />
        </div>
      </Section>

      {/* improvement report */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={CheckCircle2} title={isAr ? "نقاط القوة" : "Strengths"} tone="green">
          <BulletList items={narrative?.strengths} icon={CheckCircle2} tone="green" />
        </Section>
        <Section icon={AlertTriangle} title={isAr ? "نقاط الضعف" : "Weaknesses"} tone="red">
          <BulletList items={narrative?.weaknesses} icon={AlertTriangle} tone="red" />
        </Section>
        <Section icon={Lightbulb} title={isAr ? "التوصيات" : "Recommendations"}>
          <BulletList items={narrative?.recommendations} icon={Lightbulb} />
        </Section>
        <Section icon={Zap} title={isAr ? "أولويات وتحسينات سريعة" : "Priority & Quick Wins"} tone="amber">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{isAr ? "أولوية عالية" : "High priority"}</p>
          <BulletList items={narrative?.priorityImprovements} icon={Target} tone="amber" />
          <p className="mb-1 mt-3 text-xs font-semibold text-muted-foreground">{isAr ? "مكاسب سريعة" : "Quick wins"}</p>
          <BulletList items={narrative?.quickWins} icon={Zap} tone="green" />
        </Section>
      </div>

      {/* certifications + career improvement */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={Award} title={isAr ? "شهادات موصى بها" : "Certification Recommendations"}>
          {narrative?.certificationRecommendations?.length ? (
            <ul className="space-y-2.5">
              {narrative.certificationRecommendations.map((c, i) => (
                <li key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  {c.why && <p className="mt-0.5 text-xs text-muted-foreground">{c.why}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground">—</p>}
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{isAr ? "دورات مقترحة" : "Suggested courses"}</p>
            <Chips items={narrative?.courseRecommendations} />
          </div>
        </Section>
        <Section icon={GraduationCap} title={isAr ? "تطوير المسار المهني" : "Career Improvement"} tone="primary">
          <div className="space-y-3">
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{isAr ? "مهارات للتعلّم" : "Skills to learn"}</p><Chips items={narrative?.careerImprovement?.skillsToLearn} /></div>
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{isAr ? "برامج للتعلّم" : "Software to learn"}</p><Chips items={narrative?.careerImprovement?.softwareToLearn} /></div>
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{isAr ? "لغات" : "Languages"}</p><Chips items={narrative?.careerImprovement?.languages} /></div>
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{isAr ? "تطوير مهني" : "Professional development"}</p><Chips items={narrative?.careerImprovement?.professionalDevelopment} /></div>
          </div>
        </Section>
      </div>

      {/* transparency signals */}
      <div className="rounded-2xl border border-border bg-secondary/20 p-4">
        <p className="text-xs text-muted-foreground">
          {isAr ? "الشفافية: " : "Transparency: "}
          {isAr
            ? `حللنا ${signals.bulletCount} نقطة إنجاز، ${signals.actionRatio}% تبدأ بفعل قوي، ${signals.metricRatio}% تحتوي أرقاماً قابلة للقياس، ${match.matchedKeywords.length} كلمة مفتاحية متطابقة من ${match.matchedKeywords.length + match.missingKeywords.length}.`
            : `Analyzed ${signals.bulletCount} achievement bullets · ${signals.actionRatio}% start with a strong action verb · ${signals.metricRatio}% contain quantified metrics · ${match.matchedKeywords.length}/${match.matchedKeywords.length + match.missingKeywords.length} target keywords matched.`}
          {signals.clichesFound?.length > 0 && (isAr ? ` عبارات مبتذلة: ${signals.clichesFound.join(", ")}.` : ` Clichés detected: ${signals.clichesFound.join(", ")}.`)}
        </p>
        <button onClick={run} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
          <RefreshCw className="h-3.5 w-3.5" /> {isAr ? "إعادة التحليل" : "Re-run analysis"}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
      <p className="text-xl font-extrabold text-primary">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniList({ title, items, icon: Icon }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"><Icon className="h-3.5 w-3.5 text-primary" />{title}</p>
      {items?.length ? (
        <ul className="space-y-1">
          {items.map((it, i) => <li key={i} className="text-xs text-muted-foreground">• {it}</li>)}
        </ul>
      ) : <p className="text-xs text-green-500">{"✓"}</p>}
    </div>
  );
}
