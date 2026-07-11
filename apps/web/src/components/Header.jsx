import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, LayoutDashboard, LogOut } from "lucide-react";
import Logo from "./Logo";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { t, toggleLang, lang } = useLang();
  const { isAuthed, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/50 text-foreground/80 transition hover:text-foreground hover:border-primary/40";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-light shadow-lg shadow-black/5" : "bg-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground hover:border-primary/40"
            aria-label="Switch language"
            title="Language"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{lang === "ar" ? "EN" : "AR"}</span>
          </button>

          {isAuthed ? (
            <>
              <Link to="/dashboard" className={iconBtn} title={t.nav.dashboard}>
                <LayoutDashboard className="h-4 w-4" />
              </Link>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className={iconBtn}
                title={t.nav.logout}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg border border-border/60 bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground hover:border-primary/40"
            >
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
