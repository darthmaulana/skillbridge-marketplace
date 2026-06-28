export const TERMS_VERSION = "2026-06-28";
const TERMS_ACCEPTED_KEY = "skillbridge-terms-accepted-version";

export function hasAcceptedTerms(userId?: string | null) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(keyFor(userId)) === TERMS_VERSION;
}

export function acceptTerms(userId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyFor(userId), TERMS_VERSION);
  localStorage.setItem(`${keyFor(userId)}-accepted-at`, new Date().toISOString());
  window.dispatchEvent(new Event("skillbridge-terms-accepted"));
}

function keyFor(userId?: string | null) {
  return userId ? `${TERMS_ACCEPTED_KEY}:${userId}` : TERMS_ACCEPTED_KEY;
}
