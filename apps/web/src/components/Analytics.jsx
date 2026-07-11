import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import pb from "@/lib/pocketbaseClient";
import { mergeIntegrations } from "@/lib/siteConfig";

// Injects Google Analytics 4, Google Tag Manager, Microsoft Clarity and the
// AdSense loader — each only when its ID is configured. Reads admin-managed
// runtime overrides from the public `public_integrations` record (key "integrations").
export default function Analytics() {
  const [conf, setConf] = useState(() => mergeIntegrations(null));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await pb
          .collection("public_integrations")
          .getFirstListItem('key="integrations"');
        if (active && rec?.value) setConf(mergeIntegrations(rec.value));
      } catch {
        /* not configured / not public — env defaults stand */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const { ga4, gtm, clarity, adsense } = conf;

  return (
    <Helmet>
      {gtm && (
        <script>{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</script>
      )}
      {ga4 && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} />
      )}
      {ga4 && (
        <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}',{anonymize_ip:true});`}</script>
      )}
      {clarity && (
        <script>{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}</script>
      )}
      {adsense && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
          crossOrigin="anonymous"
        />
      )}
    </Helmet>
  );
}
