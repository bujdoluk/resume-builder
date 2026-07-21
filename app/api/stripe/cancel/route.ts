
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { action } = await request.json();
  if (action !== "cancel" && action !== "resume") {
    return errorResponse(HTTP_BAD_REQUEST, "invalidAction", request);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return errorResponse(HTTP_UNAUTHORIZED, "loginRequired", request);
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscriptionRow?.stripe_subscription_id) {
    return errorResponse(HTTP_NOT_FOUND, "noSubscriptionFound", request);
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
