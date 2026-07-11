// Central production integration config.
// IDs are read from Vite env vars (VITE_*) so they can be configured per
// deployment without hardcoding keys in source. Empty = integration disabled.
// The Admin panel can also override these at runtime via `app_settings`
// (key: "integrations") — see readRuntimeIntegrations().

const env = import.meta.env || {};

export const INTEGRATIONS = {
  ga4: env.VITE_GA4_ID || "", // e.g. "G-XXXXXXX"
  gtm: env.VITE_GTM_ID || "", // e.g. "GTM-XXXXXX"
  clarity: env.VITE_CLARITY_ID || "", // Microsoft Clarity project id
  adsense: env.VITE_ADSENSE_CLIENT || "", // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
};

// Merge runtime overrides (admin-managed) on top of env defaults.
export function mergeIntegrations(runtime) {
  if (!runtime || typeof runtime !== "object") return { ...INTEGRATIONS };
  return {
    ga4: runtime.ga4 || INTEGRATIONS.ga4,
    gtm: runtime.gtm || INTEGRATIONS.gtm,
    clarity: runtime.clarity || INTEGRATIONS.clarity,
    adsense: runtime.adsense || INTEGRATIONS.adsense,
  };
}
