/**
 * Singleton server-side Stripe client. Server-only (uses the secret key) —
 * never import this from a Client Component.
 */
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
