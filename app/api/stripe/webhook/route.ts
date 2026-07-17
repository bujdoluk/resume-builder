/**
 * Stripe webhook — the only place that writes to the `subscriptions`
 * table, via the service-role client (bypasses RLS; the table has no
 * insert/update policy for regular users — see
 * supabase/migrations/0004_create_subscriptions.sql). Must read the
 * request as raw text (not `.json()`) since signature verification needs
 * the exact bytes Stripe sent.
 *
 * Note: `current_period_end`/`price` live on each subscription *item*
 * (`subscription.items.data[0]`) in this API version, not on the
 * top-level Subscription object — verified against the installed SDK's
 * type definitions rather than assumed, since this moved in a past Stripe
 * API version.
 */
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

function planFromPriceId(priceId: string | undefined): "pro" | "annual" {
  return priceId === process.env.STRIPE_PRICE_ID_ANNUAL ? "annual" : "pro";
}

async function upsertSubscription(params: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: "free" | "pro" | "annual";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: params.userId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      plan: params.plan,
      status: params.status,
      current_period_end: params.currentPeriodEnd,
      cancel_at_period_end: params.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

function periodEndFromSubscription(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId || typeof session.customer !== "string") break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        const subscription = subscriptionId
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : null;
        const priceId = subscription?.items.data[0]?.price.id;

        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscriptionId,
          plan: planFromPriceId(priceId),
          status: subscription?.status ?? "active",
          currentPeriodEnd: subscription ? periodEndFromSubscription(subscription) : null,
          cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId || typeof subscription.customer !== "string") break;

        const isDeleted = event.type === "customer.subscription.deleted";
        const priceId = subscription.items.data[0]?.price.id;

        await upsertSubscription({
          userId,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          plan: isDeleted ? "free" : planFromPriceId(priceId),
          status: isDeleted ? "canceled" : subscription.status,
          currentPeriodEnd: isDeleted ? null : periodEndFromSubscription(subscription),
          cancelAtPeriodEnd: isDeleted ? false : subscription.cancel_at_period_end,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Failed to process Stripe webhook event ${event.type}:`, error);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
