import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { useLang } from "@/context/LanguageContext";

const COPY = {
  en: {
    badge: "AI-Powered ATS Resume Builder",
    title: "Create Your ATS Resume with AI",
    subtitle: "Build a professional ATS-optimized resume in minutes using AI.",
    cta: "Start Building My Resume",
    perks: ["No registration required", "Pay only after you see the result", "10 SAR one-time"],
  },
  ar: {
    badge: "منشئ السيرة الذاتية المتوافق مع ATS بالذكاء الاصطناعي",
    title: "أنشئ سيرتك الذاتية المتوافقة مع ATS بالذكاء الاصطناعي",
    subtitle: "أنشئ سيرة ذاتية احترافية ومحسّنة لأنظمة ATS في دقائق باستخدام الذكاء الاصطناعي.",
    cta: "ابدأ إنشاء سيرتي الذاتية",
    perks: ["بدون تسجيل", "ادفع فقط بعد رؤية النتيجة", "١٠ ريال دفعة واحدة"],
  },
};

export default function HomePage() {
  const { lang } = useLang();
  const c = COPY[lang === "ar" ? "ar" : "en"];

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <Seo />
      <Header />

      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 start-1/4 h-[28rem] w-[28rem] animate-float rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute bottom-0 end-1/4 h-[26rem] w-[26rem] animate-float rounded-full bg-indigo-600/20 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" /> {c.badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-7 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl"
          >
            {lang === "ar" ? (
              c.title
            ) : (
              <>
                Create Your <span className="gradient-text">ATS Resume</span> with AI
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <Link
              to="/get-started"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-violet-600/40 transition hover:shadow-violet-600/60 active:scale-[0.98]"
            >
              {c.cta}
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {c.perks.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> {p}
              </li>
            ))}
          </motion.ul>
        </div>
      </main>
    </div>
  );
}
