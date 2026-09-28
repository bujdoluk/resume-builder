import { Temporal } from "temporal-polyfill";

// Owner queries don't filter expired tokens, so treat an expired one as no link.
export function isShareLinkActive(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return Temporal.Instant.compare(Temporal.Instant.from(expiresAt), Temporal.Now.instant()) > 0;
}
