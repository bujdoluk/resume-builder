import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  maybeSingle: vi.fn(),
  subscriptionsCancel: vi.fn(),
  deleteUser: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  }),
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: () => ({
    auth: { admin: { deleteUser: mocks.deleteUser } },
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { cancel: mocks.subscriptionsCancel },
  }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

const fakeUser = { id: "user-1", email: "jane@example.com", is_anonymous: false };

function deleteRequest(): Request {
  return new Request("https://example.com/api/account/delete", { method: "POST" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: fakeUser } });
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.maybeSingle.mockResolvedValue({ data: null });
  mocks.subscriptionsCancel.mockResolvedValue({});
  mocks.deleteUser.mockResolvedValue({ error: null });
});

describe("POST /api/account/delete", () => {
  it("requires a logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("blocks anonymous (guest) sessions", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...fakeUser, is_anonymous: true } } });

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
  });

  it("returns 429 and deletes nothing when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("skips Stripe cancellation when the user has no subscription on file", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(mocks.subscriptionsCancel).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("cancels the Stripe subscription before deleting the account", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { stripe_subscription_id: "sub_123" } });

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(mocks.subscriptionsCancel).toHaveBeenCalledWith("sub_123");
    expect(mocks.deleteUser).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
  });

  it("aborts before deleting the account when the Stripe cancellation fails", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { stripe_subscription_id: "sub_123" } });
    mocks.subscriptionsCancel.mockRejectedValue(new Error("stripe down"));

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.failedToCancelSubscription);
    expect(mocks.captureException).toHaveBeenCalled();
    // Deleting the account after a failed cancellation would orphan an
    // active paid Stripe subscription with no user left to manage it.
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("returns 500 and reports to Sentry when the Supabase user deletion fails", async () => {
    mocks.deleteUser.mockResolvedValue({ error: new Error("admin delete failed") });

    const { POST } = await import("@/app/api/account/delete/route");
    const response = await POST(deleteRequest());

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe(en.apiErrors.failedToDeleteAccount);
    expect(mocks.captureException).toHaveBeenCalled();
  });
});
