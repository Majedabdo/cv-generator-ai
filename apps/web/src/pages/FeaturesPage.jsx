import React from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Wand2, Target, Gauge, ShieldCheck, FileSearch, Sparkles, Download, Globe, Layers, Bot, Briefcase } from "lucide-react";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { useLang } from "@/context/LanguageContext";

const features = [
  { icon: MessagesSquare, title: "Conversational AI builder", desc: "Build your entire resume through a natural conversation — no formatting or templates to fight." },
  { icon: Wand2, title: "Achievement rewriting", desc: "The AI transforms plain duties into quantified, impact-driven accomplishments." },
  { icon: Target, title: "Job-tailored resumes", desc: "Paste any job description and instantly align your resume to its keywords and tone." },
  { icon: Gauge, title: "Live ATS scoring", desc: "A real-time score guides every edit toward a higher pass rate." },
  { icon: ShieldCheck, title: "Parse-safe formatting", desc: "Clean, structured output that every major ATS reads flawlessly." },
  { icon: FileSearch, title: "Skill gap analysis", desc: "Discover missing keywords and skills before a recruiter ever notices." },
  { icon: Sparkles, title: "AI cover letters", desc: "Generate matching, personalized cover letters in seconds." },
  { icon: Download, title: "One-click export", desc: "Download recruiter-ready PDFs, perfectly formatted every time." },
  { icon: Globe, title: "Arabic & English", desc: "Full RTL and LTR support — switch languages anytime." },
];

const roadmap = [
  { icon: Bot, title: "AI Career Coach", desc: "24/7 personalized career guidance." },
  { icon: Briefcase, title: "Interview Simulator", desc: "Practice with realistic AI mock interviews." },
  { icon: Layers, title: "Portfolio Generator", desc: "Turn your resume into a hosted portfolio site." },
  { icon: Target, title: "Job Tracker", desc: "Track every application in one dashboard." },
];

export default function FeaturesPage() {
  const { t } = useLang();
  return (
    <>
      <Seo title="Features" path="/features" />
      <PageHero badge={t.aiFeatures.title} title="Everything you need to get hired" subtitle="A complete, AI-powered toolkit for building resumes that pass the ATS and impress recruiters." />
      <section className="pb-20">
        <div className="container-page grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container-page">
          <Reveal className="text-center">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">Coming soon</span>
            <h2 className="mt-4 text-3xl font-extrabold">The platform keeps growing</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">A modular architecture built for what's next in your career journey.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((r, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-dashed border-border bg-card/50 p-6">
                  <r.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-bold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/get-started" className="inline-flex rounded-xl gradient-primary px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/30">{t.hero.cta}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
