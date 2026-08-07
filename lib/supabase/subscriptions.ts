
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Plan = "free" | "pro" | "annual";
const KNOWN_PLANS: Plan[] = ["free", "pro", "annual"];

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

function toPlan(value: string): Plan {
  return (KNOWN_PLANS as string[]).includes(value) ? (value as Plan) : "free";
}

export async function getSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return FREE_SUBSCRIPTION;

  if (data.status !== "active" && data.status !== "trialing") return FREE_SUBSCRIPTION;

  return {
    plan: toPlan(data.plan),
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

export function isPaidPlan(plan: Plan): boolean {
  return plan !== "free";
}
