type CaptchaExecutor = () => Promise<string | undefined>;

// Captcha is disabled; the real implementation is in git history.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function registerCaptchaExecutor(fn: CaptchaExecutor | null) {}

export function getAnonymousCaptchaToken(): Promise<string | undefined> {
  return Promise.resolve(undefined);
}
