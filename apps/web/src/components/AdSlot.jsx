import React, { useEffect, useRef, useState } from "react";
import pb from "@/lib/pocketbaseClient";
import { mergeIntegrations } from "@/lib/siteConfig";
import { useAuth } from "@/context/AuthContext";

// Renders a Google AdSense unit ONLY for free/anonymous users.
// Paying users (plan "pro" or "team") never see ads.
export default function AdSlot({ slot, format = "auto", className = "" }) {
  const { user, isAuthed } = useAuth();
  const [client, setClient] = useState(() => mergeIntegrations(null).adsense);
  const ref = useRef(null);
  const pushed = useRef(false);

  const isPaying = isAuthed && (user?.plan === "pro" || user?.plan === "team");

  useEffect(() => {
    if (client) return;
    let active = true;
    (async () => {
      try {
        const rec = await pb
          .collection("public_integrations")
          .getFirstListItem('key="integrations"');
        if (active && rec?.value?.adsense) setClient(rec.value.adsense);
      } catch {
        /* disabled */
      }
    })();
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (isPaying || !client || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* adsbygoogle not ready yet */
    }
  }, [client, isPaying]);

  // Never render the ad container for paying users, or when unconfigured.
  if (isPaying || !client) return null;

  return (
    <div className={`mx-auto w-full max-w-3xl px-4 ${className}`} aria-hidden="true">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
