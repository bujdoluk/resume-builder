/**
 * Shared Resend client, server-only. Lazily instantiated (not created at
 * module scope) for the same reason as `lib/stripe.ts`'s `getStripe()`:
 * `new Resend(...)` throws immediately if `RESEND_API_KEY` isn't set, and
 * Next.js's build step imports route modules to collect page data — eager
 * construction there would crash the build whenever the env var isn't
 * wired up for that build environment.
 */
import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Shared "from" fallback so the sending address stays consistent across
// every email this app sends, even when RESEND_FROM_EMAIL isn't set locally.
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "QuickResumeBuilder.online <onboarding@quickresumebuilder.online>";
