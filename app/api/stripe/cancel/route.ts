/**
 * Cancels or resumes the current user's subscription (toggles Stripe's
 * `cancel_at_period_end`) — the in-app replacement for redirecting to
 * Stripe's hosted Billing Portal, used by components/AccountPage.tsx.
 *
 * Looks up `stripe_subscription_id` via the normal session-scoped client
 * (the `subscriptions` table's select policy already allows a user to
 * read their own row — see supabase/migrations/0004_create_subscriptions.sql).
 * The actual `subscriptions` table write still only ever happens in the
 * webhook (app/api/stripe/webhook/route.ts), which fires moments later in
 * response to this Stripe API call — this route just returns the fresh
 * Stripe state directly so the UI can update immediately without waiting
 * on that round-trip.
 */
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { action } = await request.json();
  if (action !== "cancel" && action !== "resume") {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }

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

  if (!subscriptionRow?.stripe_subscription_id) {
    return Response.json({ error: "No subscription found." }, { status: 404 });
  }

  const subscription = await stripe.subscriptions.update(subscriptionRow.stripe_subscription_id, {
    cancel_at_period_end: action === "cancel",
  });

  const periodEndSeconds = subscription.items.data[0]?.current_period_end;

  return Response.json({
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
  });
}
