/**
 * Bridges `ensureUserId` (a plain function called from many places — not a
 * component, so it can't hold a ref itself) to the single invisible
 * hCaptcha widget mounted once in the root layout
 * (components/InvisibleCaptcha.tsx). That component registers a token
 * executor here on mount; `ensureUserId` calls `getAnonymousCaptchaToken()`
 * right before `signInAnonymously`, which now requires one since Supabase's
 * CAPTCHA protection was turned on for all auth endpoints, silent anonymous
 * sign-in included.
 */
type CaptchaExecutor = () => Promise<string | undefined>;

let executor: CaptchaExecutor | null = null;

export function registerCaptchaExecutor(fn: CaptchaExecutor | null) {
  executor = fn;
}

const EXECUTOR_POLL_INTERVAL_MS = 100;
const EXECUTOR_POLL_ATTEMPTS = 20;

export async function getAnonymousCaptchaToken(): Promise<string | undefined> {
  // Skip the wait entirely when hCaptcha isn't configured at all (the
  // common case in local dev) — only poll when it's actually expected to
  // register eventually. Effect ordering between InvisibleCaptcha and
  // whatever called ensureUserId (e.g. Sidebar) isn't guaranteed, so the
  // executor may not be registered yet even when it will be momentarily.
  if (!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return undefined;

  for (let attempt = 0; attempt < EXECUTOR_POLL_ATTEMPTS && !executor; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, EXECUTOR_POLL_INTERVAL_MS));
  }
  if (!executor) return undefined;

  try {
    return await executor();
  } catch {
    return undefined;
  }
}
