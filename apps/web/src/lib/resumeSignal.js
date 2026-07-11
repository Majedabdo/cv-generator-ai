// Shared machine-readable signal used to hand off from the chat to the resume
// generation engine. Pilot emits this token on its own line at the very end of
// its final message once it has gathered enough information. The chat strips it
// from anything shown to the user and uses it to auto-trigger generation.

export const READY_MARKER = "[[[READY_TO_BUILD]]]";

// Matches the marker with optional surrounding whitespace / brackets variants.
const MARKER_RE = /\[\[\[\s*READY_TO_BUILD\s*\]\]\]/gi;

/** Returns true if the given text contains the readiness marker. */
export function hasReadyMarker(text) {
  if (!text) return false;
  return MARKER_RE.test(text);
}

/** Removes the readiness marker (and any leftover blank lines) from text. */
export function stripMarker(text) {
  if (!text) return text;
  return text
    .replace(MARKER_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
