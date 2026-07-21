
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
