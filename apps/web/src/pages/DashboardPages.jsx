import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, GitBranch, FileEdit, MessagesSquare, Briefcase,
  LayoutTemplate, Download, CreditCard, Receipt, User, Settings, LifeBuoy,
  Bell, LogOut, Users, BarChart3, Newspaper, Plus, Sparkles, Gift, Menu, X,
  Trash2, Copy, Pencil, Check, Loader2, Star, ShieldCheck, Clock, Award, Lock,
} from "lucide-react";
import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import pb from "@/lib/pocketbaseClient";
import { toast } from "@/hooks/use-toast";
import { exportTxt, exportDocx, exportResumePdf } from "@/lib/resumeExport";
import { integratedAiClient } from "@/lib/integratedAiClient";
import { writePending } from "@/pages/PaymentPages";
import PayPalCheckout, { usePayPalConfig } from "@/lib/paypalCheckout";

/* Unified bilingual download gate (Arabic + English, PDF/DOCX/TXT) — PayPal only, locked until payment. */
function DownloadButtons({ r, unlocked, onChange, subtle }) {
  const baseName = (r.content_en?.resume?.fullName || r.content_ar?.resume?.fullName || r.content?.resume?.fullName || r.title || "resume").replace(/\s+/g, "_");
  const langs = [
    ["en", "English", r.content_en],
    ["ar", "Arabic", r.content_ar],
  ].filter(([, , c]) => c && c.resume);
  if (langs.length === 0 && r.content?.resume) langs.push(["en", "English", r.content]);

  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(null);
  const [localUnlocked, setLocalUnlocked] = useState(unlocked);
  const { loading, config } = usePayPalConfig();
  useEffect(() => setLocalUnlocked(unlocked), [unlocked]);

  const runDownload = async ({ fmt, bundle, lang }) => {
    const nm = `${baseName} - ${lang === "ar" ? "Arabic" : "English"}`;
    if (fmt === "pdf") {
      exportResumePdf(bundle, nm);
      try {
        await pb.collection("resumes").update(r.id, { pdfDownloads: (r.pdfDownloads || 0) + 1 });
        onChange?.();
      } catch { /* download still succeeds */ }
    } else if (fmt === "docx") {
      exportDocx(bundle, nm, null);
    } else {
      exportTxt(bundle, nm);
    }
  };

  const requestDownload = (task) => {
    if (localUnlocked) { runDownload(task); return; }
    setPending(task);
    setOpen(true);
  };
  const unlockedCls = subtle
    ? "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
    : "inline-flex items-center gap-1 rounded-lg gradient-primary px-2.5 py-1.5 text-xs font-semibold text-white";
  const lockedCls = "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary";

  return (
    <>
      <div className="space-y-2">
        {langs.map(([lang, label, bundle]) => (
          <div key={lang} className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
            {[["pdf", "PDF"], ["docx", "DOCX"], ["txt", "TXT"]].map(([fmt, fl]) => (
              <button
                key={fmt}
                onClick={() => requestDownload({ fmt, bundle, lang })}
                title={localUnlocked ? `Download ${label} ${fl}` : "Unlock downloads for $2.69 USD"}
                className={localUnlocked ? unlockedCls : lockedCls}
              >
                {localUnlocked ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {fl}
              </button>
            ))}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={() => !paying && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-white"><Lock className="h-5 w-5" /></span>
              <button onClick={() => !paying && setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-4 text-xl font-extrabold">Unlock downloads for $2.69 USD (10 SAR)</h3>
            <p className="mt-1 text-sm text-muted-foreground">Unlimited Arabic &amp; English PDF, DOCX &amp; TXT downloads for “{r.title}”, forever. One-time payment.</p>
            {config?.enabled ? (
              <div className="mt-4 min-h-[150px]">
                <PayPalCheckout
                  config={config}
                  onApprove={(orderId) => {
                    writePending({ mode: "unlock", resumeId: r.id });
                    window.location.href = `/payment-success?order_id=${orderId}`;
                  }}
                  onError={(e) => toast({ variant: "destructive", title: "Unlock failed", description: e.message })}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/35 p-6 text-center text-xs text-muted-foreground">
                Loading secure payment options...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* --------------------------------- shell --------------------------------- */

const NAV = [
  { key: "home", label: "Dashboard", icon: LayoutDashboard },
  { key: "resumes", label: "My Resumes", icon: FileText },
  { key: "versions", label: "Resume Versions", icon: GitBranch },
  { key: "cover", label: "Cover Letters", icon: FileEdit },
  { key: "interview", label: "Interview Prep", icon: MessagesSquare },
  { key: "jobs", label: "Saved Jobs", icon: Briefcase },
  { key: "templates", label: "Templates", icon: LayoutTemplate },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "payments", label: "Payment History", icon: CreditCard },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "referrals", label: "Referrals", icon: Gift },
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "support", label: "Support", icon: LifeBuoy },
  { key: "notifications", label: "Notifications", icon: Bell },
];

function Shell({ active, setActive, children, plan, badges }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (key) => { setActive(key); setOpen(false); };
  const doLogout = () => { logout(); navigate("/"); };

  const SideContent = (
    <>
      <div className="flex items-center justify-between border-b border-border p-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((n) => (
          <button key={n.key} onClick={() => go(n.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === n.key ? "gradient-primary text-white shadow-lg shadow-violet-600/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <n.icon className="h-4 w-4 shrink-0" /> {n.label}
            {badges?.[n.key] > 0 && <span className={`ms-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active === n.key ? "bg-white/20" : "bg-primary/15 text-primary"}`}>{badges[n.key]}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="mb-1 rounded-xl bg-secondary/60 p-3 text-xs">
          <p className="font-semibold">Plan: <span className="capitalize gradient-text">{plan || "free"}</span></p>
        </div>
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"><LogOut className="h-4 w-4" /> Log out</button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-card lg:flex">{SideContent}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-64 flex-col bg-card">{SideContent}</aside>
        </div>
      )}
      <div className="flex-1 lg:ms-64">
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Logo />
          <button onClick={doLogout}><LogOut className="h-5 w-5" /></button>
        </header>
        <div className="p-5 sm:p-6 lg:p-10">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------ shared bits ------------------------------ */

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-4 text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function PageHead({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Empty({ icon: Icon, title, subtitle, cta }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 font-semibold">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{subtitle}</p>}
      {cta}
    </div>
  );
}

function Skeleton() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>;
}

function AtsBadge({ score }) {
  const s = score || 0;
  const tint = s >= 80 ? "bg-emerald-500/10 text-emerald-500" : s >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tint}`}>ATS {s}%</span>;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

/* -------------------------------- sections ------------------------------- */

function ResumeCard({ r, onChange, unlocked }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(r.title);
  const bundle = r.content || {};

  const save = async () => {
    setRenaming(false);
    if (name.trim() && name !== r.title) {
      await pb.collection("resumes").update(r.id, { title: name.trim() });
      onChange();
    }
  };
  const duplicate = async () => {
    await pb.collection("resumes").create({
      title: `${r.title} (copy)`, content: r.content, content_en: r.content_en, content_ar: r.content_ar, template: r.template,
      targetJob: r.targetJob, atsScore: r.atsScore, status: r.status, editsRemaining: r.editsRemaining ?? 0, owner: pb.authStore.record.id,
    });
    toast({ title: "Resume duplicated" });
    onChange();
  };
  const remove = async () => {
    await pb.collection("resumes").delete(r.id);
    toast({ title: "Resume deleted" });
    onChange();
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} autoFocus
              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold outline-none focus:border-primary" />
          ) : (
            <h3 className="truncate font-bold">{r.title}</h3>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{r.targetJob || bundle.resume?.targetTitle || "—"} · {fmtDate(r.created)}</p>
        </div>
        <AtsBadge score={r.atsScore} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-secondary px-2 py-0.5 capitalize">{r.status || "draft"}</span>
        <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" /> {r.editsRemaining ?? 0} edits left</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DownloadButtons r={r} unlocked={unlocked} onChange={onChange} subtle />
        <button onClick={() => setRenaming(true)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /> Rename</button>
        <button onClick={duplicate} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
        <button onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { isAuthed, user } = useAuth();
  const [active, setActive] = useState("home");
  const [resumes, setResumes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [rs, ps, ns, ts] = await Promise.all([
        pb.collection("resumes").getFullList({ sort: "-created" }),
        pb.collection("payments").getFullList({ sort: "-created" }).catch(() => []),
        pb.collection("notifications").getFullList({ sort: "-created" }).catch(() => []),
        pb.collection("support_tickets").getFullList({ sort: "-created" }).catch(() => []),
      ]);
      setResumes(rs); setPayments(ps); setNotifications(ns); setTickets(ts);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthed) load(); }, [isAuthed, load]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const avgAts = resumes.length ? Math.round(resumes.reduce((a, r) => a + (r.atsScore || 0), 0) / resumes.length) : 0;
  const editsLeft = resumes.reduce((a, r) => a + (r.editsRemaining || 0), 0);
  const paidResumeIds = useMemo(
    () => new Set(payments.filter((p) => p.status === "paid" && p.resume).map((p) => p.resume)),
    [payments],
  );

  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <>
      <Seo title="Dashboard" path="/dashboard" />
      <Shell active={active} setActive={setActive} plan={user?.plan} badges={{ notifications: unreadCount }}>
        {active === "home" && (
          <>
            <PageHead
              title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
              subtitle="Here's your career workspace."
              action={<Link to="/get-started" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30"><Plus className="h-4 w-4" /> New resume</Link>}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={FileText} label="Total resumes" value={loading ? "…" : resumes.length} tint="bg-violet-500/10 text-violet-500" />
              <StatCard icon={Sparkles} label="Avg. ATS score" value={loading ? "…" : `${avgAts}%`} tint="bg-emerald-500/10 text-emerald-500" />
              <StatCard icon={Pencil} label="Edits remaining" value={loading ? "…" : editsLeft} tint="bg-indigo-500/10 text-indigo-500" />
              <StatCard icon={Bell} label="Notifications" value={loading ? "…" : unreadCount} tint="bg-amber-500/10 text-amber-500" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Account status</div>
                <p className="mt-2 text-2xl font-extrabold capitalize gradient-text">{user?.plan || "free"}</p>
                <p className="text-xs text-muted-foreground">{payments.length ? "Active — lifetime access" : "No purchases yet"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><Award className="h-4 w-4 text-primary" /> Loyalty points</div>
                <p className="mt-2 text-2xl font-extrabold">{user?.points || 0}</p>
                <p className="text-xs text-muted-foreground">Redeem for discounts & extra edits</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" /> Last resume</div>
                <p className="mt-2 truncate text-lg font-bold">{resumes[0]?.title || "—"}</p>
                <p className="text-xs text-muted-foreground">{resumes[0] ? fmtDate(resumes[0].created) : "Start your first resume"}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Recent activity</h2>
                <button onClick={() => setActive("resumes")} className="text-sm font-medium text-primary">View all</button>
              </div>
              {loading ? <Skeleton /> : resumes.length === 0 ? (
                <Empty icon={FileText} title="No resumes yet" subtitle="Chat with Pilot and generate your first ATS-ready resume."
                  cta={<Link to="/get-started" className="mt-5 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white">Get started</Link>} />
              ) : (
                <div className="space-y-3">
                  {resumes.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div className="min-w-0"><p className="truncate font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{fmtDate(r.created)}</p></div>
                      <AtsBadge score={r.atsScore} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {active === "resumes" && (
          <>
            <PageHead title="My Resumes" subtitle="Every generated resume is saved permanently."
              action={<Link to="/get-started" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> New resume</Link>} />
            {loading ? <Skeleton /> : resumes.length === 0 ? (
              <Empty icon={FileText} title="No resumes yet" subtitle="Generate your first resume to see it here."
                cta={<Link to="/get-started" className="mt-5 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white">Get started</Link>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">{resumes.map((r) => <ResumeCard key={r.id} r={r} onChange={load} unlocked={paidResumeIds.has(r.id)} />)}</div>
            )}
          </>
        )}

        {active === "versions" && (
          <>
            <PageHead title="Resume Versions" subtitle="Track tailored versions for every target role." />
            {loading ? <Skeleton /> : resumes.length === 0 ? (
              <Empty icon={GitBranch} title="No versions yet" subtitle="Each resume you tailor for a specific job becomes a version." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/40 text-start text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3 text-start">Version</th><th className="p-3 text-start">Target job</th><th className="p-3 text-start">Template</th><th className="p-3 text-start">ATS</th><th className="p-3 text-start">Date</th></tr>
                  </thead>
                  <tbody>
                    {resumes.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{r.title}</td>
                        <td className="p-3 text-muted-foreground">{r.targetJob || "—"}</td>
                        <td className="p-3 text-muted-foreground">{r.template || "—"}</td>
                        <td className="p-3">{r.atsScore || 0}%</td>
                        <td className="p-3 text-muted-foreground">{fmtDate(r.created)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {active === "cover" && (
          <ListDocs resumes={resumes} loading={loading} pick={(b) => b?.documents?.coverLetter} title="Cover Letters" subtitle="AI-generated cover letters from your resumes." icon={FileEdit} label="Cover letter" />
        )}

        {active === "interview" && (
          <>
            <PageHead title="Interview Prep" subtitle="Practice questions tailored to your resume." />
            {loading ? <Skeleton /> : (() => {
              const qs = resumes.flatMap((r) => (r.content?.documents?.interviewPrep || []).map((q) => ({ ...q, resume: r.title })));
              return qs.length === 0 ? <Empty icon={MessagesSquare} title="No prep yet" subtitle="Generate a resume to unlock interview questions." /> : (
                <div className="space-y-3">
                  {qs.map((q, i) => (
                    <details key={i} className="rounded-xl border border-border bg-card p-4">
                      <summary className="cursor-pointer text-sm font-medium">{q.question}</summary>
                      <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>
                    </details>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {active === "jobs" && <SavedJobs />}

        {active === "templates" && (
          <>
            <PageHead title="Templates" subtitle="Browse premium templates for your next resume."
              action={<Link to="/templates" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"><LayoutTemplate className="h-4 w-4" /> Full gallery</Link>} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Corporate", "Executive", "Minimal", "Modern", "Creative", "Engineering"].map((name, i) => (
                <Link key={name} to="/get-started" className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:border-primary/40">
                  <div className="h-28 rounded-xl" style={{ background: `linear-gradient(120deg, hsl(${(i * 55) % 360} 70% 55%), hsl(${(i * 55 + 40) % 360} 70% 45%))` }} />
                  <p className="mt-3 font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">30+ templates available</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {active === "downloads" && (
          <>
            <PageHead title="Downloads" subtitle="Download your resumes anytime — no expiration." />
            {loading ? <Skeleton /> : resumes.length === 0 ? <Empty icon={Download} title="Nothing to download" subtitle="Your generated resumes will appear here." /> : (
              <div className="space-y-3">
                {resumes.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <div><p className="font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{fmtDate(r.created)}</p></div>
                    <DownloadButtons r={r} unlocked={paidResumeIds.has(r.id)} onChange={load} subtle />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {active === "payments" && (
          <>
            <PageHead title="Payment History" subtitle="All your transactions in one place." />
            {loading ? <Skeleton /> : payments.length === 0 ? <Empty icon={CreditCard} title="No payments yet" subtitle="Your purchases will appear here." /> : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3 text-start">Invoice</th><th className="p-3 text-start">Date</th><th className="p-3 text-start">Amount</th><th className="p-3 text-start">Method</th><th className="p-3 text-start">Status</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{p.invoiceNumber || "—"}</td>
                        <td className="p-3 text-muted-foreground">{fmtDate(p.created)}</td>
                        <td className="p-3">{p.amount} {p.currency || "SAR"}</td>
                        <td className="p-3 capitalize text-muted-foreground">{(p.method || p.provider || "—").replace("_", " ")}</td>
                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{p.status || "pending"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {active === "invoices" && (
          <>
            <PageHead title="Invoices" subtitle="Download receipts for your records." />
            {loading ? <Skeleton /> : payments.length === 0 ? <Empty icon={Receipt} title="No invoices yet" /> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {payments.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></span>
                      <span className="text-xs text-muted-foreground">{fmtDate(p.created)}</span>
                    </div>
                    <p className="mt-3 font-bold">{p.invoiceNumber || "Invoice"}</p>
                    <p className="text-sm text-muted-foreground">{p.description || "Resume unlock"}</p>
                    <p className="mt-2 text-lg font-extrabold gradient-text">{p.amount} {p.currency || "SAR"}</p>
                    <button onClick={() => downloadInvoice(p, user)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"><Download className="h-3.5 w-3.5" /> Download invoice</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {active === "referrals" && <Referrals user={user} />}
        {active === "profile" && <Profile user={user} />}
        {active === "settings" && <SettingsSection user={user} />}
        {active === "support" && <Support tickets={tickets} reload={load} />}
        {active === "notifications" && <Notifications items={notifications} reload={load} />}
      </Shell>
    </>
  );
}

/* ----------------------------- doc list helper --------------------------- */

function ListDocs({ resumes, loading, pick, title, subtitle, icon: Icon, label }) {
  const items = resumes.map((r) => ({ id: r.id, title: r.title, text: pick(r.content) })).filter((x) => x.text);
  return (
    <>
      <PageHead title={title} subtitle={subtitle} />
      {loading ? <Skeleton /> : items.length === 0 ? <Empty icon={Icon} title={`No ${label.toLowerCase()}s yet`} subtitle="Generate a resume to create these automatically." /> : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold">{it.title}</h3>
                <button onClick={() => { navigator.clipboard?.writeText(it.text); toast({ title: "Copied" }); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"><Copy className="h-3 w-3" /> Copy</button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", company: "", content: "" });
  const load = useCallback(() => {
    pb.collection("job_descriptions").getFullList({ sort: "-created" }).then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await pb.collection("job_descriptions").create({ ...form, owner: pb.authStore.record.id });
    setForm({ title: "", company: "", content: "" });
    toast({ title: "Job saved" });
    load();
  };
  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  return (
    <>
      <PageHead title="Saved Jobs" subtitle="Track roles you're targeting." />
      <form onSubmit={add} className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job title" className={inp} />
        <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className={inp} />
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Job description / notes" rows={3} className={`${inp} sm:col-span-2`} />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white sm:col-span-2"><Plus className="h-4 w-4" /> Save job</button>
      </form>
      {loading ? <Skeleton /> : jobs.length === 0 ? <Empty icon={Briefcase} title="No saved jobs" subtitle="Save a role above to keep track of your applications." /> : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div><p className="font-semibold">{j.title}</p><p className="text-xs text-muted-foreground">{j.company || "—"} · {fmtDate(j.created)}</p></div>
              <button onClick={async () => { await pb.collection("job_descriptions").delete(j.id); load(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Referrals({ user }) {
  const code = user?.referralCode || "";
  const link = code ? `${window.location.origin}/?ref=${code}` : "";
  const [refs, setRefs] = useState([]);
  useEffect(() => { pb.collection("referrals").getFullList({ sort: "-created" }).then(setRefs).catch(() => {}); }, []);
  return (
    <>
      <PageHead title="Referrals & Rewards" subtitle="Invite friends and earn loyalty points." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold"><Gift className="h-4 w-4 text-primary" /> Your referral link</div>
          {code ? (
            <>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                <span className="min-w-0 flex-1 truncate text-sm">{link}</span>
                <button onClick={() => { navigator.clipboard?.writeText(link); toast({ title: "Link copied" }); }} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white">Copy</button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">You earn <span className="font-semibold text-foreground">100 points</span> for every friend who unlocks a resume.</p>
            </>
          ) : <p className="mt-3 text-sm text-muted-foreground">Your referral code activates after your first purchase.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4 text-primary" /> Loyalty points</div>
          <p className="mt-2 text-4xl font-extrabold gradient-text">{user?.points || 0}</p>
          <p className="text-sm text-muted-foreground">Redeem for discounts, extra AI edits, or premium templates.</p>
          <div className="mt-4 space-y-2 text-sm">
            {[["200 pts", "10 SAR discount"], ["500 pts", "Free resume unlock"], ["300 pts", "+3 AI edits"]].map(([p, r]) => (
              <div key={p} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"><span>{r}</span><span className="font-semibold">{p}</span></div>
            ))}
          </div>
        </div>
      </div>
      {refs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold">Invited friends</h3>
          <div className="space-y-2">
            {refs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{r.invitedEmail}</span>
                <span className="text-primary">+{r.pointsAwarded || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Profile({ user }) {
  const [form, setForm] = useState({
    name: user?.name || "", title: user?.title || "", phone: user?.phone || "",
    linkedin: user?.linkedin || "", portfolio: user?.portfolio || "",
  });
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await pb.collection("users").update(pb.authStore.record.id, form); toast({ title: "Profile updated" }); }
    catch { toast({ variant: "destructive", title: "Update failed" }); }
    finally { setSaving(false); }
  };
  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
  const rows = [["name", "Full name"], ["title", "Professional title"], ["phone", "Phone"], ["linkedin", "LinkedIn URL"], ["portfolio", "Portfolio URL"]];
  return (
    <>
      <PageHead title="Profile" subtitle="Your details are reused across every resume." />
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">Email</span><input value={user?.email || ""} disabled className={`${inp} opacity-60`} /></div>
        {rows.map(([k, label]) => (
          <div key={k} className="grid gap-1"><span className="text-xs font-medium text-muted-foreground">{label}</span><input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inp} /></div>
        ))}
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes</button>
      </form>
    </>
  );
}

function SettingsSection({ user }) {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHead title="Settings" subtitle="Manage your account and security." />
      <div className="max-w-xl space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">Password</h3>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure link to set a new password.</p>
          <button onClick={() => { requestPasswordReset(user?.email).catch(() => {}); setSent(true); }} className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">{sent ? "Link sent ✓" : "Send reset link"}</button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">Data & privacy</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your data is encrypted and stored securely. GDPR-ready. Export or deletion requests can be made via Support.</p>
        </div>
      </div>
    </>
  );
}

function Support({ tickets, reload }) {
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      await pb.collection("support_tickets").create({ ...form, status: "open", owner: pb.authStore.record.id });
      setForm({ subject: "", message: "", priority: "normal" });
      toast({ title: "Ticket submitted" });
      reload();
    } catch { toast({ variant: "destructive", title: "Could not submit" }); }
    finally { setSaving(false); }
  };
  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
  return (
    <>
      <PageHead title="Support" subtitle="Submit tickets, report bugs, or request a refund." />
      <form onSubmit={submit} className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-5">
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className={inp} />
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your question, bug, suggestion, or refund request…" rows={4} className={inp} />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inp}>
          <option value="low">Low priority</option><option value="normal">Normal</option><option value="high">High priority</option>
        </select>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />} Submit ticket</button>
      </form>
      {tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div><p className="font-semibold">{t.subject}</p><p className="text-xs text-muted-foreground">{fmtDate(t.created)} · {t.priority}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "closed" ? "bg-secondary text-muted-foreground" : "bg-emerald-500/10 text-emerald-500"}`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Notifications({ items, reload }) {
  const markAll = async () => {
    await Promise.all(items.filter((n) => !n.read).map((n, i) => pb.collection("notifications").update(n.id, { read: true }, { requestKey: `nread-${i}` })));
    reload();
  };
  return (
    <>
      <PageHead title="Notifications" subtitle="Stay on top of your resume activity."
        action={items.some((n) => !n.read) ? <button onClick={markAll} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Mark all read</button> : null} />
      {items.length === 0 ? <Empty icon={Bell} title="No notifications" subtitle="Updates about payments, resumes, and support will appear here." /> : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 ${n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{n.title}</p>
                <span className="text-xs text-muted-foreground">{fmtDate(n.created)}</span>
              </div>
              {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function downloadInvoice(p, user) {
  const lines = [
    "CVPilot AI — INVOICE",
    "====================",
    `Invoice: ${p.invoiceNumber || "—"}`,
    `Date: ${fmtDate(p.created)}`,
    `Billed to: ${user?.name || ""} <${user?.email || ""}>`,
    "",
    `Description: ${p.description || "Resume unlock"}`,
    `Method: ${(p.method || p.provider || "card").replace("_", " ")}`,
    `Amount: ${p.amount} ${p.currency || "SAR"}`,
    `Status: ${p.status || "paid"}`,
    "",
    "Thank you for your purchase.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${p.invoiceNumber || "invoice"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------------------------- admin --------------------------------- */

export function AdminPage() {
  const { isAuthed, isAdmin } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  const nav = [
    { key: "users", label: "Users", icon: Users },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "support", label: "Support", icon: LifeBuoy },
    { key: "templates", label: "Templates", icon: LayoutTemplate },
    { key: "blog", label: "Blog", icon: Newspaper },
  ];
  return (
    <>
      <Seo title="Admin" path="/admin" />
      <div className="min-h-screen bg-secondary/20 p-6 lg:p-10">
        <div className="mx-auto max-w-6xl">
          {!isAdmin && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">This is a preview of the admin structure. Full admin access is role-restricted.</div>
          )}
          <h1 className="text-2xl font-extrabold">Admin overview</h1>
          <p className="mt-1 text-muted-foreground">Platform structure — modules prepared for future development.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total users" value="—" tint="bg-violet-500/10 text-violet-500" />
            <StatCard icon={CreditCard} label="Revenue" value="—" tint="bg-emerald-500/10 text-emerald-500" />
            <StatCard icon={FileText} label="Resumes" value="—" tint="bg-indigo-500/10 text-indigo-500" />
            <StatCard icon={LifeBuoy} label="Open tickets" value="—" tint="bg-amber-500/10 text-amber-500" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nav.map((n) => (
              <div key={n.key} className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
                <n.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-bold">{n.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Module scaffolded — ready to build.</p>
              </div>
            ))}
          </div>
          <Link to="/dashboard" className="mt-8 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">← Back to user dashboard</Link>
        </div>
      </div>
    </>
  );
}
