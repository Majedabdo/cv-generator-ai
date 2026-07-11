import React from "react";
import { ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import AdSlot from "@/components/AdSlot";

const posts = [
  { title: "How to beat the ATS in 2025", cat: "ATS", excerpt: "The tactics that actually get your resume past applicant tracking systems this year.", read: "6 min" },
  { title: "10 resume mistakes recruiters hate", cat: "Career", excerpt: "Small errors that cost you interviews — and how to fix them in minutes.", read: "5 min" },
  { title: "Writing achievement-based bullet points", cat: "Writing", excerpt: "Turn boring job duties into quantified wins that grab attention.", read: "7 min" },
  { title: "The complete guide to AI cover letters", cat: "AI", excerpt: "How to use AI to craft personalized cover letters that don't sound robotic.", read: "8 min" },
  { title: "Arabic resumes: what's different", cat: "Career", excerpt: "Formatting, tone, and RTL considerations for the MENA job market.", read: "5 min" },
  { title: "Keywords: the language of hiring", cat: "ATS", excerpt: "Why the exact words on your resume matter more than you think.", read: "4 min" },
];
const colors = { ATS: "text-emerald-500 bg-emerald-500/10", Career: "text-violet-500 bg-violet-500/10", Writing: "text-amber-500 bg-amber-500/10", AI: "text-indigo-500 bg-indigo-500/10" };

export default function BlogPage() {
  return (
    <>
      <Seo title="Blog" path="/blog" breadcrumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      <PageHero badge="CVPilot Blog" title="Career insights & resume strategy" subtitle="Expert guides to help you write better resumes, beat the ATS, and land more interviews." />
      <section className="pb-24">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={i} delay={(i % 3) * 0.07}>
              <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40">
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${colors[p.cat]}`}>{p.cat}</span>
                <h3 className="mt-4 text-lg font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{p.read} read</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">Read <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180" /></span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <AdSlot slot="blog-footer" className="pb-16" />
    </>
  );
}
