import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANONYMOUS_ACCOUNT_RETENTION_DAYS } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  deleteUser: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: () => ({
    rpc: mocks.rpc,
    auth: { admin: { deleteUser: mocks.deleteUser } },
  }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

function cronRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new Request("https://example.com/api/cron/cleanup-anonymous-users", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-cron-secret";
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
});

describe("POST /api/cron/cleanup-anonymous-users", () => {
  it("returns 401 and never queries Supabase when the bearer token is wrong", async () => {
    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.unauthorized);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns 401 when no authorization header is sent", async () => {
    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest());

    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed (401) when CRON_SECRET isn't configured, even with a header present", async () => {
    delete process.env.CRON_SECRET;

    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer undefined"));

    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("queries stale anonymous users with the configured retention window", async () => {
    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    await POST(cronRequest("Bearer test-cron-secret"));

    expect(mocks.rpc).toHaveBeenCalledWith("get_stale_anonymous_user_ids", {
      retention_days: ANONYMOUS_ACCOUNT_RETENTION_DAYS,
    });
  });

  it("returns 500 and reports to Sentry when the stale-user query fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("rpc failed") });

    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe(en.apiErrors.cleanupQueryFailed);
    expect(mocks.captureException).toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("reports zero deleted/failed when there are no stale users", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });

    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer test-cron-secret"));

    expect(await response.json()).toEqual({ deleted: 0, failed: 0 });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes every stale user returned by the query", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ id: "user-a" }, { id: "user-b" }, { id: "user-c" }],
      error: null,
    });

    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer test-cron-secret"));

    expect(mocks.deleteUser).toHaveBeenCalledTimes(3);
    expect(mocks.deleteUser).toHaveBeenNthCalledWith(1, "user-a");
    expect(mocks.deleteUser).toHaveBeenNthCalledWith(2, "user-b");
    expect(mocks.deleteUser).toHaveBeenNthCalledWith(3, "user-c");
    expect(await response.json()).toEqual({ deleted: 3, failed: 0 });
  });

  it("keeps processing the rest of the batch when one deletion fails, and reports the count accurately", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ id: "user-a" }, { id: "user-bad" }, { id: "user-c" }],
      error: null,
    });
    mocks.deleteUser.mockImplementation(async (id: string) =>
      id === "user-bad" ? { error: new Error("delete failed") } : { error: null },
    );

    const { POST } = await import("@/app/api/cron/cleanup-anonymous-users/route");
    const response = await POST(cronRequest("Bearer test-cron-secret"));

    // All three ids must be attempted — a single bad row must not abort the batch.
    expect(mocks.deleteUser).toHaveBeenCalledTimes(3);
    expect(await response.json()).toEqual({ deleted: 2, failed: 1 });
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });
});
