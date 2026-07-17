/**
 * Read-only access to the `subscriptions` table. Rows are only ever
 * written by the Stripe webhook (app/api/stripe/webhook/route.ts) via the
 * service-role client — the table has no insert/update/delete policies for
 * regular users (see supabase/migrations/0004_create_subscriptions.sql). A
 * user with no row — every free user — is treated as plan "free"; no row
 * is ever written just for being on the free plan.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Plan = "free" | "pro" | "annual";

export interface Subscription {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const FREE_SUBSCRIPTION: Subscription = {
  plan: "free",
  status: "active",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export const FREE_TIER_LIMITS = {
  resumes: 2,
  coverLetters: 2,
};

interface SubscriptionTableRow {
  plan: Plan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return FREE_SUBSCRIPTION;

  const row = data as SubscriptionTableRow;
  // A row left over from a lapsed/canceled subscription (status no longer
  // active/trialing) no longer grants paid limits, regardless of `plan`.
  if (row.status !== "active" && row.status !== "trialing") return FREE_SUBSCRIPTION;

  return {
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

export function isPaidPlan(plan: Plan): boolean {
  return plan !== "free";
}
