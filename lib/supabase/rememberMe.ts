/**
 * "Remember me" for email/password login (components/LoginPage.tsx):
 * whether the session cookie survives closing the browser.
 *
 * `@supabase/ssr`'s browser storage adapter always writes the session
 * cookie with its own default max-age (400 days — the maximum Chrome
 * allows; see `DEFAULT_COOKIE_OPTIONS` in `@supabase/ssr`'s cookie storage
 * code) every time a session is persisted, and ignores any custom
 * `cookieOptions.maxAge` passed to `createBrowserClient` for that
 * particular write — so there's no supported way to make signing in
 * default to a session-only cookie. Instead, right after a successful
 * login with "remember me" unchecked, this rewrites the already-set auth
 * cookie(s) in place — same name and value, just without a max-age/expires
 * — which the browser then treats as a session cookie, cleared when it
 * closes.
 */
function getAuthCookiePrefix(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

export function forgetSessionOnBrowserClose() {
  if (typeof document === "undefined") return;
  const prefix = getAuthCookiePrefix();
  if (!prefix) return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  for (const entry of document.cookie.split("; ")) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = entry.slice(0, separatorIndex);
    if (name !== prefix && !name.startsWith(`${prefix}.`)) continue;
    const value = entry.slice(separatorIndex + 1);
    document.cookie = `${name}=${value}; path=/; SameSite=Lax${secure}`;
  }
}
