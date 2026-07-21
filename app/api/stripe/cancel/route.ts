
import { getStripe } from "@/lib/stripe";
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

  const subscription = await getStripe().subscriptions.update(subscriptionRow.stripe_subscription_id, {
    cancel_at_period_end: action === "cancel",
  });

  const periodEndSeconds = subscription.items.data[0]?.current_period_end;

  return Response.json({
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
  });
}
