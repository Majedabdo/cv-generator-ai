import React, { useState } from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { useLang } from "@/context/LanguageContext";

const TPL_IMG = "https://images.hostinger.com/2dab322a-2c6d-4456-8473-329db0a6506d.png";
const templates = [
  { name: "Executive", cat: "Professional", premium: false },
  { name: "Modern", cat: "Professional", premium: false },
  { name: "Minimal", cat: "Simple", premium: false },
  { name: "Creative", cat: "Creative", premium: true },
  { name: "Technical", cat: "Professional", premium: true },
  { name: "Elegant", cat: "Simple", premium: true },
  { name: "Bold", cat: "Creative", premium: true },
  { name: "Classic", cat: "Simple", premium: false },
];
const cats = ["All", "Professional", "Simple", "Creative"];

export default function TemplatesPage() {
  const { t } = useLang();
  const [filter, setFilter] = useState("All");
  const shown = templates.filter((tp) => filter === "All" || tp.cat === filter);
  return (
    <>
      <Seo title="Resume Templates" path="/templates" />
      <PageHero badge={t.templatesPreview.title} title={t.templatesPreview.title} subtitle={t.templatesPreview.subtitle} />
      <section className="pb-24">
        <div className="container-page">
          <div className="flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === c ? "gradient-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((tp, i) => (
              <Reveal key={tp.name} delay={(i % 4) * 0.06}>
                <div className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-900/20">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={TPL_IMG} alt={`${tp.name} template`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <Link to="/get-started" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary">Use template</Link>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div><p className="font-semibold">{tp.name}</p><p className="text-xs text-muted-foreground">{tp.cat}</p></div>
                    {tp.premium && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Pro</span>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
