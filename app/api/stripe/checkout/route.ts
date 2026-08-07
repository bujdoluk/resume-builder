
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import {
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  RATE_LIMIT_STRIPE_CHECKOUT_REQUESTS,
  RATE_LIMIT_STRIPE_CHECKOUT_WINDOW,
} from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { stripeCheckoutBodySchema } from "@/lib/validation/stripeCheckout";

const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  annual: process.env.STRIPE_PRICE_ID_ANNUAL,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = validateBody(stripeCheckoutBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidPlan", request);
  }

  const priceId = PRICE_IDS[parsed.data.plan];
  if (!priceId) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidPlan", request);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return errorResponse(HTTP_UNAUTHORIZED, "loginRequired", request);
  }

  const allowed = await checkRateLimit(
    "stripe-checkout",
    user.id,
    RATE_LIMIT_STRIPE_CHECKOUT_REQUESTS,
    RATE_LIMIT_STRIPE_CHECKOUT_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const { origin } = new URL(request.url);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/#pricing`,
  });

  return Response.json({ url: session.url });
}
