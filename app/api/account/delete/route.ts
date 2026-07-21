
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_BAD_GATEWAY, HTTP_INTERNAL_SERVER_ERROR, HTTP_UNAUTHORIZED } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST(request: Request) {
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

  if (subscriptionRow?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(subscriptionRow.stripe_subscription_id);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      return errorResponse(HTTP_BAD_GATEWAY, "failedToCancelSubscription", request);
    }
  }

  const { error } = await createServiceRoleClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error(error);
    Sentry.captureException(error);
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToDeleteAccount", request);
  }

  return Response.json({ ok: true });
}
