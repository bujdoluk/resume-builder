/**
 * Server-side Stripe client. Server-only (uses the secret key) — never
 * import this from a Client Component. Lazily instantiated (not created
 * at module scope) so importing this file never throws even if
 * STRIPE_SECRET_KEY isn't available yet — Next.js's build step imports API
 * route modules to collect page data, which used to construct `new
 * Stripe(...)` eagerly and crash the build whenever the env var wasn't
 * wired up for that build environment.
 */
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
