/**
 * Server-side hCaptcha token verification, used by `/api/send-email` to
 * stop that route being used to spam arbitrary addresses through this
 * app's Resend account. Unlike the login/signup/anonymous-session flows —
 * where Supabase itself verifies the token against a secret configured in
 * the Supabase Dashboard — this route never touches Supabase Auth, so it
 * has to verify the token itself against hCaptcha's own API.
 *
 * A no-op (always "verified") until `HCAPTCHA_SECRET_KEY` is set, matching
 * every other optional integration in this app — local dev and any
 * deployment that hasn't configured hCaptcha yet both keep working.
 */
const VERIFY_URL = "https://api.hcaptcha.com/siteverify";

export async function verifyCaptchaToken(token: unknown): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}
