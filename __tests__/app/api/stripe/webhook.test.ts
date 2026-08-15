import type Stripe from "stripe";
import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieveSubscription: vi.fn(),
  createServiceRoleClient: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  captureException: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    subscriptions: { retrieve: mocks.retrieveSubscription },
  }),
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

vi.mock("@/lib/email/sendWelcomeEmail", () => ({
  sendWelcomeEmail: mocks.sendWelcomeEmail,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("@/lib/auditLog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auditLog")>();
  return { ...actual, logAuditEvent: mocks.logAuditEvent };
});

// A minimal fake of supabase-js's fluent query builder covering exactly
// what the webhook route uses: `.from("subscriptions").upsert(...)` and
// `.from("subscriptions").select("id").eq(...).maybeSingle()`.
function createSupabaseMock(opts: {
  existingRow?: { id: string } | null;
  upsertError?: Error | null;
}) {
  const upsert = vi.fn().mockResolvedValue({ error: opts.upsertError ?? null });
  const maybeSingle = vi.fn().mockResolvedValue({ data: opts.existingRow ?? null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ upsert, select }));
  return { from, upsert, maybeSingle };
}

function postRequest(body: string, signature: string | null = "test-signature") {
  const headers = new Headers();
  if (signature) headers.set("stripe-signature", signature);
  return new Request("https://example.com/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

function checkoutCompletedEvent(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: { userId: "user-1" },
        client_reference_id: null,
        customer: "cus_123",
        subscription: "sub_123",
        customer_details: { email: "jane@example.com" },
        customer_email: null,
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

function fakeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: { id: "price_pro" },
          current_period_end: 1_800_000_000,
        },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function subscriptionEvent(
  type: "customer.subscription.updated" | "customer.subscription.deleted",
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Event {
  return {
    type,
    data: {
      object: {
        ...fakeSubscription(overrides),
        metadata: { userId: "user-1" },
      },
    },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_PRICE_ID_ANNUAL", "price_annual");
});

describe("POST /api/stripe/webhook", () => {
  it("returns 400 and never touches Supabase when the signature is invalid", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid signature");
    expect(mocks.captureException).toHaveBeenCalled();
    expect(mocks.createServiceRoleClient).not.toHaveBeenCalled();
  });

  it("upserts a subscription and sends a welcome email for a brand-new customer", async () => {
    mocks.constructEvent.mockReturnValue(checkoutCompletedEvent());
    mocks.retrieveSubscription.mockResolvedValue(fakeSubscription({ status: "active" }));
    const { from, upsert } = createSupabaseMock({ existingRow: null });
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        plan: "pro",
        status: "active",
        current_period_end: Temporal.Instant.fromEpochMilliseconds(1_800_000_000 * 1000).toString({
          fractionalSecondDigits: 3,
        }),
        cancel_at_period_end: false,
      }),
      { onConflict: "user_id" },
    );
    expect(mocks.sendWelcomeEmail).toHaveBeenCalledWith("jane@example.com", "pro", "https://example.com");
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        actorEmail: "jane@example.com",
        action: "subscription.created",
      }),
    );
  });

  it("still returns 200 and records the subscription when the welcome email fails", async () => {
    mocks.constructEvent.mockReturnValue(checkoutCompletedEvent());
    mocks.retrieveSubscription.mockResolvedValue(fakeSubscription({ status: "active" }));
    const { from, upsert } = createSupabaseMock({ existingRow: null });
    mocks.createServiceRoleClient.mockReturnValue({ from });
    mocks.sendWelcomeEmail.mockRejectedValue(new Error("resend down"));

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalled();
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { stripeEventType: "checkout.session.completed" } }),
    );
  });

  it("does not send a welcome email when the customer already has a subscription row", async () => {
    mocks.constructEvent.mockReturnValue(checkoutCompletedEvent());
    mocks.retrieveSubscription.mockResolvedValue(fakeSubscription());
    const { from, upsert } = createSupabaseMock({ existingRow: { id: "existing-sub" } });
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    await POST(postRequest("{}"));

    expect(upsert).toHaveBeenCalled();
    expect(mocks.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "subscription.updated" }),
    );
  });

  it("maps the annual price ID to the annual plan", async () => {
    mocks.constructEvent.mockReturnValue(checkoutCompletedEvent());
    mocks.retrieveSubscription.mockResolvedValue(
      fakeSubscription({
        items: { data: [{ price: { id: "price_annual" }, current_period_end: 1_800_000_000 }] },
      } as Partial<Stripe.Subscription>),
    );
    const { from, upsert } = createSupabaseMock({ existingRow: null });
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    await POST(postRequest("{}"));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "annual" }),
      { onConflict: "user_id" },
    );
  });

  it("forces plan to free and clears the period end when a subscription is deleted, regardless of the event payload", async () => {
    mocks.constructEvent.mockReturnValue(
      subscriptionEvent("customer.subscription.deleted", {
        status: "canceled",
        cancel_at_period_end: true, // should still be forced to false below
      }),
    );
    const { from, upsert } = createSupabaseMock({});
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "free",
        status: "canceled",
        current_period_end: null,
        cancel_at_period_end: false,
      }),
      { onConflict: "user_id" },
    );
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "subscription.canceled" }),
    );
  });

  it("updates plan and status directly from a customer.subscription.updated event", async () => {
    mocks.constructEvent.mockReturnValue(
      subscriptionEvent("customer.subscription.updated", { status: "past_due" }),
    );
    const { from, upsert } = createSupabaseMock({});
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    await POST(postRequest("{}"));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "pro", status: "past_due" }),
      { onConflict: "user_id" },
    );
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "subscription.updated", actorEmail: null }),
    );
  });

  it("ignores events with no userId in metadata", async () => {
    mocks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: { ...fakeSubscription(), metadata: {} } },
    } as unknown as Stripe.Event);
    const { from, upsert } = createSupabaseMock({});
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });

  it("returns 200 and does nothing for unhandled event types", async () => {
    mocks.constructEvent.mockReturnValue({
      type: "invoice.paid",
      data: { object: {} },
    } as unknown as Stripe.Event);
    const { from, upsert } = createSupabaseMock({});
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(upsert).not.toHaveBeenCalled();
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });

  it("returns 500 and reports to Sentry when the Supabase upsert fails", async () => {
    mocks.constructEvent.mockReturnValue(
      subscriptionEvent("customer.subscription.updated"),
    );
    const { from } = createSupabaseMock({ upsertError: new Error("db down") });
    mocks.createServiceRoleClient.mockReturnValue({ from });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(postRequest("{}"));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Webhook handler error");
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { stripeEventType: "customer.subscription.updated" } }),
    );
    // upsertSubscription throws before reaching its own logAuditEvent call
    // when the upsert itself fails — a failed write must never be recorded
    // as a successful subscription change.
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });
});
