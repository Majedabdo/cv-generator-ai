import React from "react";
import Seo from "@/components/Seo";
import PageHero from "@/components/PageHero";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    path: "/privacy",
    intro: "Your privacy matters. This policy explains what data we collect and how we protect it.",
    sections: [
      ["Information we collect", "We collect the information you provide when building a resume (work history, education, skills), your account details, and standard usage analytics to improve the product."],
      ["How we use your data", "Your data is used solely to generate and store your resumes, provide support, and improve our services. We never sell your personal information."],
      ["Data security", "Passwords are encrypted, sessions are secured over HTTPS, and we apply industry best practices including protection against XSS and CSRF attacks."],
      ["Cookies & analytics", "We use cookies and integrate analytics tools (Google Analytics, Tag Manager, Meta Pixel, Microsoft Clarity) to understand usage. You can control cookies via your browser."],
      ["Your rights", "You may request access to, correction of, or deletion of your personal data at any time by contacting support@cvpilot.ai."],
    ],
  },
  terms: {
    title: "Terms of Service",
    path: "/terms",
    intro: "By using CVPilot AI you agree to these terms. Please read them carefully.",
    sections: [
      ["Acceptance of terms", "By accessing or using CVPilot AI, you agree to be bound by these Terms of Service and our Privacy Policy."],
      ["Use of the service", "You may use the platform to create resumes and career documents for lawful purposes only. You are responsible for the accuracy of the information you provide."],
      ["Accounts", "You are responsible for safeguarding your account credentials and for all activity under your account."],
      ["Subscriptions & billing", "Paid plans renew automatically until cancelled. You can cancel anytime and retain access until the end of your billing period."],
      ["Intellectual property", "You retain ownership of your content. CVPilot AI retains ownership of the platform, software, and templates."],
      ["Limitation of liability", "The service is provided 'as is'. CVPilot AI is not liable for hiring outcomes or indirect damages."],
    ],
  },
  refund: {
    title: "Refund Policy",
    path: "/refund",
    intro: "We stand behind our product with a fair and transparent refund policy.",
    sections: [
      ["Money-back guarantee", "If you're not satisfied with a paid subscription, you may request a full refund within 14 days of your initial purchase."],
      ["How to request a refund", "Email support@cvpilot.ai from your account email with your order reference. Refunds are processed within 5–10 business days."],
      ["Eligibility", "Refunds apply to first-time purchases. Renewals are eligible for a pro-rated refund at our discretion."],
      ["Non-refundable items", "Add-on credits that have already been consumed are non-refundable."],
    ],
  },
};

export default function LegalPage({ type }) {
  const c = CONTENT[type];
  return (
    <>
      <Seo title={c.title} path={c.path} />
      <PageHero title={c.title} subtitle={c.intro} />
      <section className="pb-24">
        <div className="container-page max-w-3xl space-y-8">
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          {c.sections.map(([h, body], i) => (
            <div key={i}>
              <h2 className="text-xl font-bold">{i + 1}. {h}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
