import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, ShieldAlert, ServerCrash, Wrench, Compass } from "lucide-react";
import Seo from "@/components/Seo";

function Shell({ code, icon: Icon, title, message, children, noindex = true }) {
  return (
    <>
      <Seo title={title} path="/" noindex={noindex} />
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 start-1/4 h-96 w-96 animate-float rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-0 end-1/4 h-80 w-80 animate-float rounded-full bg-indigo-600/20 blur-3xl" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-white shadow-xl shadow-violet-600/30">
            <Icon className="h-8 w-8" />
          </span>
          {code && <p className="mt-8 text-7xl font-extrabold gradient-text sm:text-8xl">{code}</p>}
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{message}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

const homeBtn = (
  <Link to="/" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-[0.98]">
    <Home className="h-5 w-5" /> Back to home
  </Link>
);

function backBtn() {
  return (
    <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-6 py-3 font-semibold transition hover:border-primary/40">
      <ArrowLeft className="h-5 w-5 rtl:rotate-180" /> Go back
    </button>
  );
}

export function NotFoundPage() {
  return (
    <Shell code="404" icon={Compass} title="Page not found" message="The page you're looking for doesn't exist or has been moved.">
      {homeBtn}
      {backBtn()}
    </Shell>
  );
}

export function ForbiddenPage() {
  return (
    <Shell code="403" icon={ShieldAlert} title="Access denied" message="You don't have permission to view this page. Sign in with the right account and try again.">
      {homeBtn}
      <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-6 py-3 font-semibold transition hover:border-primary/40">Sign in</Link>
    </Shell>
  );
}

export function ServerErrorPage() {
  return (
    <Shell code="500" icon={ServerCrash} title="Something went wrong" message="An unexpected error occurred on our side. Please try again in a moment.">
      <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/30">Reload</button>
      {homeBtn}
    </Shell>
  );
}

export function MaintenancePage() {
  return (
    <Shell icon={Wrench} title="We'll be right back" message="CVPilot AI is undergoing scheduled maintenance to bring you a better experience. Please check back shortly.">
      <a href="mailto:support@cvpilot.ai" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-6 py-3 font-semibold transition hover:border-primary/40">Contact support</a>
    </Shell>
  );
}
