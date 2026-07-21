
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
