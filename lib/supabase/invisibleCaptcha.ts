/**
 * Bridges `ensureUserId` (a plain function called from many places — not a
 * component, so it can't hold a ref itself) to the single invisible
 * hCaptcha widget mounted once in the root layout
 * (components/InvisibleCaptcha.tsx). That component registers a token
 * executor here on mount; `ensureUserId` calls `getAnonymousCaptchaToken()`
 * right before `signInAnonymously`, which now requires one since Supabase's
 * CAPTCHA protection was turned on for all auth endpoints, silent anonymous
 * sign-in included. `EmailButton.tsx` also calls this same function to
 * protect `/api/send-email` against abuse — a second, independent consumer
 * of the same shared widget, which is why concurrent requests are queued
 * below rather than fired in parallel.
 */
type CaptchaExecutor = () => Promise<string | undefined>;

let executor: CaptchaExecutor | null = null;

export function registerCaptchaExecutor(fn: CaptchaExecutor | null) {
  executor = fn;
}

const EXECUTOR_POLL_INTERVAL_MS = 100;
const EXECUTOR_POLL_ATTEMPTS = 20;

async function requestToken(): Promise<string | undefined> {
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

// hCaptcha's invisible widget only supports one .execute() call at a time —
// a second concurrent call cancels the first ("hcaptcha-execute-replaced",
// the bug that originally motivated `ensureUserId`'s own dedup in
// session.ts). Now that two independent features (silent anonymous
// sign-in, and email-sending) both request tokens from this same widget,
// concurrent requests are queued behind whichever is already in flight
// instead of racing — each request still gets its own fresh token, rather
// than sharing one single-use token between two different verifications.
let queue: Promise<unknown> = Promise.resolve();

export function getAnonymousCaptchaToken(): Promise<string | undefined> {
  // Skip the queue/wait entirely when hCaptcha isn't configured at all (the
  // common case in local dev) — only queue when a token is actually
  // expected to materialize eventually.
  if (!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return Promise.resolve(undefined);

  const next = queue.catch(() => {}).then(requestToken);
  queue = next;
  return next;
}
