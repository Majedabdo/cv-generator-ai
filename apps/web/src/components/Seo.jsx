import React from "react";
import { Helmet } from "react-helmet";

const SITE = "https://cvpilot.ai";
const OG_IMAGE = "https://images.hostinger.com/c8ec08e2-8225-4c7d-8df8-ac2c0546424b.png";

export default function Seo({
  title,
  description,
  path = "/",
  image = OG_IMAGE,
  type = "website",
  breadcrumbs,
  faq,
  noindex = false,
}) {
  const fullTitle = title
    ? `${title} · CVPilot AI`
    : "CVPilot AI — Create your ATS Resume using AI";
  const desc =
    description ||
    "CVPilot AI builds recruiter-ready, ATS-optimized resumes through a simple AI conversation. No sign-up required to start.";
  const url = `${SITE}${path}`;

  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "CVPilot AI",
      url: SITE,
      logo: OG_IMAGE,
      sameAs: [
        "https://twitter.com/cvpilotai",
        "https://www.linkedin.com/company/cvpilotai",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "CVPilot AI",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "CVPilot AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];

  if (Array.isArray(breadcrumbs) && breadcrumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${SITE}${b.path}`,
      })),
    });
  }

  if (Array.isArray(faq) && faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large" />
      )}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="CVPilot AI" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@cvpilotai" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">
        {JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}
      </script>
    </Helmet>
  );
}
