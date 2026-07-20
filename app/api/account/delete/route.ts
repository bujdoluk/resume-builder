/**
 * Permanently deletes the current user's account — used by the "Delete my
 * account" control on components/AccountPage.tsx. Cancels any active Stripe
 * subscription immediately (not the `cancel_at_period_end` toggle
 * app/api/stripe/cancel/route.ts uses — there's no account left afterward
 * to "keep access until period end"), then deletes the Supabase auth user
 * via a service-role client. Deleting the auth user cascades every
 * resumes/cover_letters/subscriptions row automatically — all three tables
 * have `on delete cascade` foreign keys to auth.users (see
 * supabase/migrations/0001_create_resumes.sql, 0003_create_cover_letters.sql,
 * 0004_create_subscriptions.sql) — so no manual row cleanup is needed here.
 *
 * If Stripe cancellation fails, deletion is aborted entirely: better to
 * leave the account intact and ask the user to retry than to delete an
 * account Stripe still thinks is actively billing, with no one left able to
 * log back in and stop it.
 */
import * as Sentry from "@sentry/nextjs";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionRow?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(subscriptionRow.stripe_subscription_id);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      return Response.json(
        { error: "Failed to cancel your subscription. Please try again or contact support." },
        { status: 502 },
      );
    }
  }

  const { error } = await createServiceRoleClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error(error);
    Sentry.captureException(error);
    return Response.json({ error: "Failed to delete account." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
