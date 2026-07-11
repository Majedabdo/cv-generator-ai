import React from "react";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { Target, Heart, Globe, Zap } from "lucide-react";

const TEAM_IMG = "https://images.hostinger.com/58740569-6305-4d1b-a670-b1cbf1d00b67.png";
const values = [
  { icon: Target, title: "Outcome-obsessed", desc: "We measure success by the interviews and offers our users win." },
  { icon: Heart, title: "Human-first AI", desc: "Technology that amplifies people — never replaces the human story." },
  { icon: Globe, title: "Globally inclusive", desc: "Built for every language and market, starting with Arabic and English." },
  { icon: Zap, title: "Relentlessly simple", desc: "Powerful under the hood, effortless on the surface." },
];

export default function AboutPage() {
  return (
    <>
      <Seo title="About Us" path="/about" />
      <PageHero badge="Our mission" title="We're leveling the career playing field" subtitle="CVPilot AI exists to give every job seeker access to the tools that were once reserved for those who could afford a professional resume writer." />
      <section className="pb-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border shadow-xl"><img src={TEAM_IMG} alt="The CVPilot AI team" className="w-full object-cover" loading="lazy" /></div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl font-extrabold">Built by people who've been on both sides of the hiring table</h2>
            <p className="mt-4 text-muted-foreground">We're a team of engineers, recruiters, and career coaches who saw how broken the resume process is. Applicant Tracking Systems reject qualified people every day simply because of formatting. We set out to fix that with AI that's accessible to everyone.</p>
            <p className="mt-4 text-muted-foreground">Today, CVPilot AI helps millions of professionals across 180+ countries present their best selves — in their own language.</p>
          </Reveal>
        </div>
      </section>
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container-page">
          <Reveal className="text-center"><h2 className="text-3xl font-extrabold">What we believe</h2></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-border bg-card p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><v.icon className="h-6 w-6" /></span>
                  <h3 className="mt-5 font-bold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
