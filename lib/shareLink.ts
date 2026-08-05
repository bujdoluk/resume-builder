import { Temporal } from "temporal-polyfill";

// A share token row can have share_token set but share_token_expires_at in
// the past (the owner-scoped getResume/getCoverLetter queries — unlike
// getResumeByShareToken/getCoverLetterByShareToken — don't filter expired
// tokens out at the database level). This treats an expired token the same
// as no token at all, so the UI prompts to create a fresh link instead of
// showing a link that would 404 for anyone who opens it.
export function isShareLinkActive(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return Temporal.Instant.compare(Temporal.Instant.from(expiresAt), Temporal.Now.instant()) > 0;
}
