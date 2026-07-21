
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  annual: process.env.STRIPE_PRICE_ID_ANNUAL,
};

export async function POST(request: Request) {
  const { plan } = await request.json();
  const priceId = typeof plan === "string" ? PRICE_IDS[plan] : undefined;
  if (!priceId) {
    return Response.json({ error: "Invalid plan." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return Response.json({ error: "Login required." }, { status: 401 });
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
