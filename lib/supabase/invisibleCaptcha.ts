
import { CAPTCHA_POLL_ATTEMPTS, CAPTCHA_POLL_INTERVAL_MS } from "@/lib/constants";

type CaptchaExecutor = () => Promise<string | undefined>;

let executor: CaptchaExecutor | null = null;

export function registerCaptchaExecutor(fn: CaptchaExecutor | null) {
  executor = fn;
}

async function requestToken(): Promise<string | undefined> {
  for (let attempt = 0; attempt < CAPTCHA_POLL_ATTEMPTS && !executor; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, CAPTCHA_POLL_INTERVAL_MS));
  }
  if (!executor) return undefined;

  try {
    return await executor();
  } catch {
    return undefined;
  }
}

let queue: Promise<unknown> = Promise.resolve();

export function getAnonymousCaptchaToken(): Promise<string | undefined> {

  if (!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) return Promise.resolve(undefined);

  const next = queue.catch(() => {}).then(requestToken);
  queue = next;
  return next;
}
