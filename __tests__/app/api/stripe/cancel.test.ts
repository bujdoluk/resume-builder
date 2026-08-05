import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  maybeSingle: vi.fn(),
  subscriptionsUpdate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { update: mocks.subscriptionsUpdate },
  }),
}));

const fakeUser = { id: "user-1", email: "jane@example.com", is_anonymous: false };

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/stripe/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: fakeUser } });
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.maybeSingle.mockResolvedValue({ data: { stripe_subscription_id: "sub_123" } });
  mocks.subscriptionsUpdate.mockResolvedValue({
    status: "active",
    cancel_at_period_end: true,
    items: { data: [{ current_period_end: 1_800_000_000 }] },
  });
});

describe("POST /api/stripe/cancel", () => {
  it("rejects an action other than cancel/resume without touching auth or Stripe", async () => {
    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "delete" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidAction);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.subscriptionsUpdate).not.toHaveBeenCalled();
  });

  it("requires a logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
    expect(mocks.subscriptionsUpdate).not.toHaveBeenCalled();
  });

  it("blocks anonymous (guest) sessions", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...fakeUser, is_anonymous: true } } });

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
  });

  it("returns 429 and never calls Stripe when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.subscriptionsUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the user has no Stripe subscription on file", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe(en.apiErrors.noSubscriptionFound);
    expect(mocks.subscriptionsUpdate).not.toHaveBeenCalled();
  });

  it("cancels at period end for a 'cancel' action", async () => {
    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: true,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "active",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: Temporal.Instant.fromEpochMilliseconds(1_800_000_000 * 1000).toString({
        fractionalSecondDigits: 3,
      }),
    });
  });

  it("flips cancel_at_period_end back to false for a 'resume' action", async () => {
    mocks.subscriptionsUpdate.mockResolvedValue({
      status: "active",
      cancel_at_period_end: false,
      items: { data: [{ current_period_end: 1_800_000_000 }] },
    });

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "resume" }));

    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: false,
    });
    expect((await response.json()).cancelAtPeriodEnd).toBe(false);
  });

  it("returns a null currentPeriodEnd when Stripe reports no subscription items", async () => {
    mocks.subscriptionsUpdate.mockResolvedValue({
      status: "canceled",
      cancel_at_period_end: false,
      items: { data: [] },
    });

    const { POST } = await import("@/app/api/stripe/cancel/route");
    const response = await POST(jsonRequest({ action: "cancel" }));

    expect((await response.json()).currentPeriodEnd).toBeNull();
  });
});
