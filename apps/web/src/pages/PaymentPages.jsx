import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { useLang } from "@/context/LanguageContext";
import { integratedAiClient } from "@/lib/integratedAiClient";
import pb from "@/lib/pocketbaseClient";
import { toast } from "@/hooks/use-toast";

const PENDING_KEY = "cvpilot-pending-payment";

export function readPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch { return null; }
}
export function writePending(v) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(v)); } catch { /* noop */ }
}
export function clearPending() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* noop */ }
}

export function PaymentSuccessPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | done | error
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const orderId = params.get("order_id") || params.get("token") || "";
    const pending = readPending();

    async function complete() {
      if (!orderId) { setStatus("error"); setMessage(isAr ? "معرّف الطلب مفقود." : "Missing order id."); return; }
      try {
        if (pending?.mode === "unlock") {
          await integratedAiClient.fetch("/payments/unlock-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeId: pending.resumeId, orderId, method: "paypal", amount: 269, currency: "USD" }),
          });
          clearPending();
          setStatus("done");
          toast({ title: isAr ? "تم فتح التنزيلات" : "Downloads unlocked" });
          setTimeout(() => navigate("/dashboard"), 1200);
          return;
        }
        // Default: builder checkout (creates account + saves resume).
        const result = await integratedAiClient.fetch("/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pending?.email,
            name: pending?.name || "",
            method: "paypal",
            orderId,
            amount: 269,
            currency: "USD",
            contentEn: pending?.contentEn || null,
            contentAr: pending?.contentAr || null,
            template: pending?.template || "",
            referralCode: pending?.referralCode || "",
          }),
        });
        if (result.account?.token && result.account?.record) {
          pb.authStore.save(result.account.token, result.account.record);
        }
        clearPending();
        setStatus("done");
        setMessage(isAr ? `فاتورتك ${result.invoiceNumber}` : `Invoice ${result.invoiceNumber}`);
        toast({ title: isAr ? "تم الدفع بنجاح" : "Payment successful", description: isAr ? "تم فتح سيرتك الذاتية." : "Your resume is unlocked." });
        setTimeout(() => navigate("/dashboard"), 1400);
      } catch (err) {
        setStatus("error");
        setMessage(err.message || (isAr ? "فشل التحقق من الدفع." : "Payment verification failed."));
      }
    }
    complete();
  }, [params, navigate, isAr]);

  return (
    <Frame>
      {status === "verifying" && (
        <>
          <Loader2 className="h-14 w-14 animate-spin text-primary" />
          <h1 className="mt-6 text-2xl font-extrabold">{isAr ? "جارٍ التحقق من دفعتك…" : "Verifying your payment…"}</h1>
          <p className="mt-2 text-muted-foreground">{isAr ? "يرجى الانتظار، لا تغلق هذه الصفحة." : "Please wait, don't close this page."}</p>
        </>
      )}
      {status === "done" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          <h1 className="mt-6 text-2xl font-extrabold">{isAr ? "تم الدفع بنجاح!" : "Payment successful!"}</h1>
          <p className="mt-2 text-muted-foreground">{message} · {isAr ? "جارٍ تحويلك إلى لوحتك…" : "Redirecting to your dashboard…"}</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <h1 className="mt-6 text-2xl font-extrabold">{isAr ? "تعذّر تأكيد الدفع" : "Payment could not be confirmed"}</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex gap-3">
            <Link to="/builder" className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white">{isAr ? "إعادة المحاولة" : "Retry payment"}</Link>
            <Link to="/" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">{isAr ? "الرئيسية" : "Home"}</Link>
          </div>
        </>
      )}
    </Frame>
  );
}

export function PaymentCancelPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  useEffect(() => { clearPending(); }, []);
  return (
    <Frame>
      <XCircle className="h-16 w-16 text-amber-500" />
      <h1 className="mt-6 text-2xl font-extrabold">{isAr ? "تم إلغاء الدفع" : "Payment cancelled"}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{isAr ? "لم يتم خصم أي مبلغ. يمكنك إعادة المحاولة في أي وقت." : "No charge was made. You can retry whenever you're ready."}</p>
      <div className="mt-6 flex gap-3">
        <Link to="/builder" className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white">{isAr ? "إعادة المحاولة" : "Try again"}</Link>
        <Link to="/" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">{isAr ? "الرئيسية" : "Home"}</Link>
      </div>
    </Frame>
  );
}

function Frame({ children }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
        <Link to="/" className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/50"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
        <Logo />
      </header>
      <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-6">
        <div className="flex flex-col items-center text-center">{children}</div>
      </div>
    </div>
  );
}
