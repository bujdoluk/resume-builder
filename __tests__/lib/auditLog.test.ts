import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: () => ({
    from: () => ({ insert: mocks.insert }),
  }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
});

describe("logAuditEvent", () => {
  it("inserts a row mapping camelCase params to the snake_case table shape", async () => {
    const { logAuditEvent, AUDIT_ACTIONS } = await import("@/lib/auditLog");

    await logAuditEvent({
      userId: "user-1",
      actorEmail: "jane@example.com",
      action: AUDIT_ACTIONS.BLOG_CREATE,
      target: "how-to-write-a-resume",
      metadata: { title: "How to write a resume" },
    });

    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      actor_email: "jane@example.com",
      action: "blog.create",
      target: "how-to-write-a-resume",
      metadata: { title: "How to write a resume" },
    });
    expect(mocks.captureException).not.toHaveBeenCalled();
  });

  it("defaults target to null and metadata to {} when omitted", async () => {
    const { logAuditEvent, AUDIT_ACTIONS } = await import("@/lib/auditLog");

    await logAuditEvent({
      userId: "user-1",
      actorEmail: null,
      action: AUDIT_ACTIONS.ACCOUNT_DELETE,
    });

    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      actor_email: null,
      action: "account.delete",
      target: null,
      metadata: {},
    });
  });

  it("swallows an insert error instead of throwing, and reports it to Sentry", async () => {
    mocks.insert.mockResolvedValue({ error: new Error("insert failed") });
    const { logAuditEvent, AUDIT_ACTIONS } = await import("@/lib/auditLog");

    await expect(
      logAuditEvent({ userId: "user-1", actorEmail: null, action: AUDIT_ACTIONS.ACCOUNT_DELETE }),
    ).resolves.toBeUndefined();

    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { auditAction: "account.delete" } }),
    );
  });

  it("swallows an unexpected thrown error too (e.g. the client itself failing)", async () => {
    mocks.insert.mockRejectedValue(new Error("network error"));
    const { logAuditEvent, AUDIT_ACTIONS } = await import("@/lib/auditLog");

    await expect(
      logAuditEvent({ userId: "user-1", actorEmail: null, action: AUDIT_ACTIONS.BLOG_CREATE }),
    ).resolves.toBeUndefined();

    expect(mocks.captureException).toHaveBeenCalled();
  });
});
