
import type Stripe from "stripe";
import { Temporal } from "temporal-polyfill";
import * as Sentry from "@sentry/nextjs";
import { AUDIT_ACTIONS, logAuditEvent, type AuditAction } from "@/lib/auditLog";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR, HTTP_OK } from "@/lib/constants";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { getStripe } from "@/lib/stripe";
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
  action: AuditAction;
  actorEmail?: string | null;
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
      updated_at: Temporal.Now.instant().toString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  await logAuditEvent({
    userId: params.userId,
    actorEmail: params.actorEmail ?? null,
    action: params.action,
    metadata: {
      plan: params.plan,
      status: params.status,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
    },
  });
}

function periodEndFromSubscription(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds
    ? Temporal.Instant.fromEpochMilliseconds(seconds * 1000).toString({ fractionalSecondDigits: 3 })
    : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    Sentry.captureException(error);
    return new Response("Invalid signature", { status: HTTP_BAD_REQUEST });
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
        const plan = planFromPriceId(priceId);

        const precheckClient = createServiceRoleClient();
        const { data: existingRow } = await precheckClient
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const email = session.customer_details?.email ?? session.customer_email;

        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscriptionId,
          plan,
          status: subscription?.status ?? "active",
          currentPeriodEnd: subscription ? periodEndFromSubscription(subscription) : null,
          cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
          action: existingRow ? AUDIT_ACTIONS.SUBSCRIPTION_UPDATED : AUDIT_ACTIONS.SUBSCRIPTION_CREATED,
          actorEmail: email,
        });

        if (!existingRow && email) {
          const { origin } = new URL(request.url);
          try {
            await sendWelcomeEmail(email, plan, origin);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
            Sentry.captureException(error, { tags: { stripeEventType: event.type } });
          }
        }
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
          // No actor email here — Stripe doesn't include it on the
          // subscription payload, and looking it up would mean an extra
          // API call on every webhook just for this field. metadata's
          // stripeCustomerId is enough to identify the account if needed.
          action: isDeleted ? AUDIT_ACTIONS.SUBSCRIPTION_CANCELED : AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Failed to process Stripe webhook event ${event.type}:`, error);
    Sentry.captureException(error, { tags: { stripeEventType: event.type } });
    return new Response("Webhook handler error", { status: HTTP_INTERNAL_SERVER_ERROR });
  }

  return new Response("ok", { status: HTTP_OK });
}
