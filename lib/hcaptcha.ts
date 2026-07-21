
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
