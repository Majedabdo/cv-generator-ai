import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Github, Instagram, ArrowRight, Check } from "lucide-react";
import Logo from "./Logo";
import { useLang } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const [subscribed, setSubscribed] = useState(false);

  const cols = [
    { title: t.footer.company, links: [["/about", t.nav.about], ["/blog", t.nav.blog], ["/pricing", t.nav.pricing], ["/contact", t.nav.contact]] },
    { title: t.footer.resources, links: [["/features", t.nav.features], ["/templates", t.nav.templates], ["/faq", t.nav.faq], ["/blog", t.nav.blog]] },
    { title: t.footer.support, links: [["/contact", t.nav.contact], ["/faq", t.nav.faq], ["/dashboard", t.nav.dashboard]] },
    { title: t.footer.legal, links: [["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"], ["/refund", "Refund Policy"]] },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border bg-secondary/40">
      <div className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t.footer.tagline}</p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Linkedin, Github, Instagram].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background/50 text-muted-foreground transition hover:text-primary hover:border-primary/40">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-5">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="text-sm font-semibold">{c.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map(([to, label]) => (
                    <li key={to + label}>
                      <Link to={to} className="text-sm text-muted-foreground transition hover:text-foreground">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold">{t.footer.newsletter}</h4>
            <p className="mt-4 text-sm text-muted-foreground">{t.footer.newsletterDesc}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}
              className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 p-1.5"
            >
              <input
                type="email"
                required
                placeholder={t.footer.emailPlaceholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary text-white" aria-label={t.footer.subscribe}>
                {subscribed ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} CVPilot AI. {t.footer.rights}</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/refund" className="hover:text-foreground">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
