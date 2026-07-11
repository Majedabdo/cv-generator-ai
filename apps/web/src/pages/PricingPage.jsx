import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { useLang } from "@/context/LanguageContext";

export default function PricingPage() {
  const { t } = useLang();
  const [billing, setBilling] = useState("monthly");
  const compare = [
    ["AI resumes", "1", "Unlimited", "Unlimited"],
    ["Premium templates", "—", "All", "All"],
    ["AI cover letters", "—", "Yes", "Yes"],
    ["Advanced ATS engine", "—", "Yes", "Yes"],
    ["Team seats", "1", "1", "5"],
    ["Ad-free experience", "—", "Yes", "Yes"],
    ["Priority support", "—", "—", "Yes"],
  ];
  return (
    <>
      <Seo title="Pricing" path="/pricing" />
      <PageHero badge={t.pricing.title} title={t.pricing.title} subtitle={t.pricing.subtitle} />
      <section className="pb-12">
        <div className="container-page">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-border bg-card p-1">
              {["monthly", "yearly"].map((b) => (
                <button key={b} onClick={() => setBilling(b)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${billing === b ? "gradient-primary text-white" : "text-muted-foreground"}`}>
                  {b === "monthly" ? t.pricing.monthly : t.pricing.yearly}{b === "yearly" && <span className="ms-2 text-xs opacity-80">{t.pricing.save}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((p, i) => {
              const popular = i === 1;
              const price = billing === "yearly" && p.price !== "0" ? Math.round(Number(p.price) * 0.8) : p.price;
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <div className={`relative flex h-full flex-col rounded-3xl border p-8 ${popular ? "border-primary/60 bg-card shadow-2xl shadow-violet-900/20" : "border-border bg-card/60"}`}>
                    {popular && <span className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white">{t.pricing.popular}</span>}
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                    <div className="mt-6 flex items-end gap-1"><span className="text-4xl font-extrabold">${price}</span><span className="mb-1 text-sm text-muted-foreground">{t.pricing.perMonth}</span></div>
                    <ul className="mt-6 flex-1 space-y-3">
                      {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>)}
                    </ul>
                    <Link to="/get-started" className={`mt-8 rounded-xl py-3 text-center text-sm font-semibold transition ${popular ? "gradient-primary text-white shadow-lg shadow-violet-600/30" : "border border-border hover:border-primary/40"}`}>{t.pricing.cta}</Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      <section className="pb-24">
        <div className="container-page max-w-4xl">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr><th className="p-4 text-start font-semibold">Compare plans</th><th className="p-4 font-semibold">Free</th><th className="p-4 font-semibold text-primary">Pro</th><th className="p-4 font-semibold">Team</th></tr>
                </thead>
                <tbody>
                  {compare.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-4 text-start text-muted-foreground">{row[0]}</td>
                      {row.slice(1).map((c, j) => <td key={j} className="p-4 text-center font-medium">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
