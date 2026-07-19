/**
 * Sends the subscription welcome email — called from
 * app/api/stripe/webhook/route.ts's checkout.session.completed handler,
 * only when the user had no prior subscriptions row (see the existence
 * check there), so this fires once per user, never on renewals, plan
 * switches, or resubscribes after a cancellation.
 */
import * as Sentry from "@sentry/nextjs";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";

export type SubscriptionPlan = "pro" | "annual";

export async function sendWelcomeEmail(
  email: string,
  plan: SubscriptionPlan,
  origin: string,
): Promise<void> {
  const planName = plan === "annual" ? "Annual" : "Pro";
  try {
    await getResend().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Welcome to QuickResumeBuilder ${planName}!`,
      text: `Thanks for subscribing to QuickResumeBuilder ${planName}!\n\nYou now have unlimited saved resumes and cover letters. You can view or manage your subscription anytime at ${origin}/account.\n\n— The QuickResumeBuilder.online team`,
      html: `<p>Thanks for subscribing to <strong>QuickResumeBuilder ${planName}</strong>!</p><p>You now have unlimited saved resumes and cover letters. You can view or manage your subscription anytime at <a href="${origin}/account">${origin}/account</a>.</p><p>— The QuickResumeBuilder.online team</p>`,
    });
  } catch (error) {
    // Best-effort — a failed welcome email shouldn't fail the whole webhook
    // (the subscription itself is already upserted by the time this runs).
    console.error("Failed to send welcome email:", error);
    Sentry.captureException(error, { tags: { plan } });
  }
}
