import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  sessionsCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mocks.sessionsCreate } },
  }),
}));

// PRICE_IDS is built from these env vars at module load time, so they must
// be set before the route module is ever imported (each test dynamically
// imports it after configuring mocks, but all tests share this same env).
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test";
process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_test";

const fakeUser = { id: "user-1", email: "jane@example.com", is_anonymous: false };

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: fakeUser } });
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.sessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session/test" });
});

describe("POST /api/stripe/checkout", () => {
  it("rejects an unrecognized plan without touching Stripe", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({ plan: "bogus" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidPlan);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing plan", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidPlan);
  });

  it("rejects a malformed JSON body without touching Stripe", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const request = new Request("https://example.com/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidPlan);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("requires a logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({ plan: "monthly" }));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("blocks anonymous (guest) sessions from checking out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...fakeUser, is_anonymous: true } } });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({ plan: "monthly" }));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 429 and never calls Stripe when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({ plan: "monthly" }));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a subscription checkout session for the monthly plan", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(jsonRequest({ plan: "monthly" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://checkout.stripe.com/session/test" });
    expect(mocks.sessionsCreate).toHaveBeenCalledWith({
      mode: "subscription",
      line_items: [{ price: "price_monthly_test", quantity: 1 }],
      customer_email: "jane@example.com",
      client_reference_id: "user-1",
      metadata: { userId: "user-1" },
      subscription_data: { metadata: { userId: "user-1" } },
      success_url: "https://example.com/app?checkout=success",
      cancel_url: "https://example.com/#pricing",
    });
  });

  it("uses the annual price ID for the annual plan", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    await POST(jsonRequest({ plan: "annual" }));

    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_annual_test", quantity: 1 }],
      }),
    );
  });
});
