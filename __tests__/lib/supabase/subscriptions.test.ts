import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";

// A minimal fake of supabase-js's fluent query builder covering exactly what
// getSubscription uses: `.from("subscriptions").select(...).eq(...).maybeSingle()`.
function createSupabaseMock(result: { data?: unknown; error?: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from } as unknown as SupabaseClient, from, select, eq, maybeSingle };
}

describe("getSubscription", () => {
  it("queries the subscriptions table scoped to the given user", async () => {
    const { supabase, from, select, eq } = createSupabaseMock({ data: null, error: null });

    await getSubscription(supabase, "user-1");

    expect(from).toHaveBeenCalledWith("subscriptions");
    expect(select).toHaveBeenCalledWith(
      "plan, status, current_period_end, cancel_at_period_end",
    );
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns the free plan when the user has no subscription row", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(getSubscription(supabase, "user-1")).resolves.toEqual({
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });

  it("maps an active row to its actual plan and details", async () => {
    const { supabase } = createSupabaseMock({
      data: {
        plan: "pro",
        status: "active",
        current_period_end: "2026-09-01T00:00:00.000Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await expect(getSubscription(supabase, "user-1")).resolves.toEqual({
      plan: "pro",
      status: "active",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    });
  });

  it("treats a trialing row as paid, not free", async () => {
    const { supabase } = createSupabaseMock({
      data: {
        plan: "annual",
        status: "trialing",
        current_period_end: "2026-09-01T00:00:00.000Z",
        cancel_at_period_end: false,
      },
      error: null,
    });

    await expect(getSubscription(supabase, "user-1")).resolves.toMatchObject({
      plan: "annual",
      status: "trialing",
    });
  });

  it.each(["past_due", "canceled", "incomplete_expired", "unpaid"])(
    "falls back to the free plan for a %s row, even though the row itself claims a paid plan",
    async (status) => {
      const { supabase } = createSupabaseMock({
        data: {
          plan: "pro",
          status,
          current_period_end: "2026-09-01T00:00:00.000Z",
          cancel_at_period_end: false,
        },
        error: null,
      });

      await expect(getSubscription(supabase, "user-1")).resolves.toEqual({
        plan: "free",
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    },
  );

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(getSubscription(supabase, "user-1")).rejects.toThrow("select failed");
  });
});

describe("isPaidPlan", () => {
  it("returns false for the free plan", () => {
    expect(isPaidPlan("free")).toBe(false);
  });

  it.each(["pro", "annual"] as const)("returns true for the %s plan", (plan) => {
    expect(isPaidPlan(plan)).toBe(true);
  });
});
