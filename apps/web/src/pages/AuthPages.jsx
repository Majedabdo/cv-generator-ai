import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Check } from "lucide-react";
import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

function Shell({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 start-1/4 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 end-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-violet-900/10">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm"><Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to home</Link></p>
      </div>
    </div>
  );
}

const field = "w-full rounded-xl border border-border bg-background py-3 ps-11 pe-4 text-sm outline-none transition focus:border-primary";
const iconCls = "pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";

function GoogleBtn({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold transition hover:border-primary/40">
      <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"/></svg>
      {label}
    </button>
  );
}

export function LoginPage() {
  const { t } = useLang();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { const a = await login(form.email, form.password); navigate(a?.record?.role === "admin" ? "/admin" : "/dashboard"); }
    catch (_) { setError("Invalid email or password."); }
    finally { setLoading(false); }
  };
  return (
    <><Seo title="Log in" path="/login" />
      <Shell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
        <GoogleBtn label={t.auth.google} onClick={() => loginWithGoogle().then(() => navigate("/dashboard")).catch(() => setError("Google sign-in is not configured yet."))} />
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t.auth.or}<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative"><Mail className={iconCls} /><input type="email" required placeholder={t.auth.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} /></div>
          <div className="relative"><Lock className={iconCls} /><input type="password" required placeholder={t.auth.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} /></div>
          <div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-medium text-primary">{t.auth.forgot}</Link></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl gradient-primary py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-[0.99] disabled:opacity-60">{loading ? t.common.loading : t.auth.login}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{t.auth.noAccount} <Link to="/get-started" className="font-semibold text-primary">{t.auth.signup}</Link></p>
      </Shell>
    </>
  );
}

export function GetStartedPage() {
  const { t } = useLang();
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await signup(form.email, form.password, form.name); navigate("/dashboard"); }
    catch (err) { setError(err?.response?.data ? "Please check your details (password min 8 chars)." : "Could not create account."); }
    finally { setLoading(false); }
  };
  return (
    <><Seo title="Get Started" path="/get-started" />
      <Shell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
        <GoogleBtn label={t.auth.google} onClick={() => loginWithGoogle().then(() => navigate("/dashboard")).catch(() => setError("Google sign-in is not configured yet."))} />
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t.auth.or}<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative"><User className={iconCls} /><input required placeholder={t.auth.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} /></div>
          <div className="relative"><Mail className={iconCls} /><input type="email" required placeholder={t.auth.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} /></div>
          <div className="relative"><Lock className={iconCls} /><input type="password" required minLength={8} placeholder={t.auth.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl gradient-primary py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-[0.99] disabled:opacity-60">{loading ? t.common.loading : t.auth.register}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{t.auth.haveAccount} <Link to="/login" className="font-semibold text-primary">{t.auth.login}</Link></p>
      </Shell>
    </>
  );
}

export function ForgotPasswordPage() {
  const { t } = useLang();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await requestPasswordReset(email); } catch (_) {}
    setSent(true); setLoading(false);
  };
  return (
    <><Seo title="Reset password" path="/forgot-password" />
      <Shell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
        {sent ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-7 w-7" /></span>
            <p className="mt-4 text-sm text-muted-foreground">If an account exists for {email}, a reset link is on its way.</p>
            <Link to="/login" className="mt-6 font-semibold text-primary">{t.auth.backToLogin}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative"><Mail className={iconCls} /><input type="email" required placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></div>
            <button disabled={loading} className="w-full rounded-xl gradient-primary py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-[0.99] disabled:opacity-60">{loading ? t.common.loading : t.auth.sendReset}</button>
            <p className="text-center text-sm"><Link to="/login" className="font-medium text-primary">{t.auth.backToLogin}</Link></p>
          </form>
        )}
      </Shell>
    </>
  );
}
