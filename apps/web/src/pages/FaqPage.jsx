import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import Seo from "@/components/Seo";
import PageHero from "@/components/PageHero";
import { useLang } from "@/context/LanguageContext";

export default function FaqPage() {
  const { t } = useLang();
  const [open, setOpen] = useState(0);
  const extra = [
    { q: "Which file formats can I export?", a: "You can export your resume as a print-ready PDF. More formats are on the roadmap." },
    { q: "Do you offer refunds?", a: "Yes. See our Refund Policy — we offer a straightforward money-back guarantee within the eligible period." },
    { q: "Will free users see ads?", a: "Free users see minimal, non-intrusive ads. Pro and Team users enjoy a fully ad-free experience." },
  ];
  const items = [...t.faq.items, ...extra];
  return (
    <>
      <Seo
        title="FAQ"
        path="/faq"
        faq={items}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]}
      />
      <PageHero badge={t.faq.title} title={t.faq.title} subtitle={t.faq.subtitle} />
      <section className="pb-24">
        <div className="container-page max-w-3xl space-y-3">
          {items.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 p-5 text-start">
                <span className="font-semibold">{item.q}</span>
                {open === i ? <Minus className="h-5 w-5 shrink-0 text-primary" /> : <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />}
              </button>
              <motion.div initial={false} animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
