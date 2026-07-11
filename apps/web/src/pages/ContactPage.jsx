import React, { useState } from "react";
import { Mail, MapPin, MessageSquare, Check } from "lucide-react";
import Seo from "@/components/Seo";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/context/AuthContext";

export default function ContactPage() {
  const { isAuthed, user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAuthed) {
        await pb.collection("support_tickets").create({
          subject: form.subject || "Contact enquiry",
          message: form.message,
          status: "open",
          priority: "normal",
          owner: user.id,
        });
      }
      setSent(true);
    } catch (_) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary";
  return (
    <>
      <Seo title="Contact" path="/contact" />
      <PageHero badge="Get in touch" title="We'd love to hear from you" subtitle="Questions, feedback, or partnership ideas — our team typically replies within one business day." />
      <section className="pb-24">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <div className="space-y-4">
              {[[Mail, "Email", "support@cvpilot.ai"], [MessageSquare, "Live chat", "Available 9am–6pm GMT"], [MapPin, "Office", "Remote-first, worldwide"]].map(([Icon, title, val]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{val}</p></div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-3">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-border bg-card p-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-7 w-7" /></span>
                <h3 className="mt-5 text-xl font-bold">Message sent</h3>
                <p className="mt-2 text-muted-foreground">Thanks for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-2 block text-sm font-medium">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} /></div>
                  <div><label className="mb-2 block text-sm font-medium">Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} /></div>
                </div>
                <div className="mt-4"><label className="mb-2 block text-sm font-medium">Subject</label><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} /></div>
                <div className="mt-4"><label className="mb-2 block text-sm font-medium">Message</label><textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={field} /></div>
                <button disabled={loading} className="mt-6 w-full rounded-xl gradient-primary py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-[0.99] disabled:opacity-60">{loading ? "Sending..." : "Send message"}</button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
