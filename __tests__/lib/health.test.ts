import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  getRedis: vi.fn(),
  ping: vi.fn(),
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: () => ({
    from: () => ({ select: mocks.select }),
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  getRedis: mocks.getRedis,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockResolvedValue({ error: null });
  mocks.getRedis.mockReturnValue(null);
});

describe("checkDatabase", () => {
  it("reports ok with a latency when the query succeeds", async () => {
    const { checkDatabase } = await import("@/lib/health");

    const result = await checkDatabase();

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toEqual(expect.any(Number));
  });

  it("reports not ok when the query returns an error", async () => {
    mocks.select.mockResolvedValue({ error: new Error("connection refused") });

    const { checkDatabase } = await import("@/lib/health");

    expect(await checkDatabase()).toEqual({ ok: false, latencyMs: null });
  });

  it("reports not ok when the query hangs past the timeout", async () => {
    vi.useFakeTimers();
    mocks.select.mockReturnValue(new Promise(() => {})); // never resolves

    const { checkDatabase } = await import("@/lib/health");
    const resultPromise = checkDatabase();
    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({ ok: false, latencyMs: null });
    vi.useRealTimers();
  });
});

describe("checkRedis", () => {
  it("reports ok with a null latency when Redis isn't configured", async () => {
    mocks.getRedis.mockReturnValue(null);

    const { checkRedis } = await import("@/lib/health");

    expect(await checkRedis()).toEqual({ ok: true, latencyMs: null });
    expect(mocks.ping).not.toHaveBeenCalled();
  });

  it("reports ok with a latency when ping succeeds", async () => {
    mocks.ping.mockResolvedValue("PONG");
    mocks.getRedis.mockReturnValue({ ping: mocks.ping });

    const { checkRedis } = await import("@/lib/health");
    const result = await checkRedis();

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toEqual(expect.any(Number));
  });

  it("reports not ok when ping rejects", async () => {
    mocks.ping.mockRejectedValue(new Error("timeout"));
    mocks.getRedis.mockReturnValue({ ping: mocks.ping });

    const { checkRedis } = await import("@/lib/health");

    expect(await checkRedis()).toEqual({ ok: false, latencyMs: null });
  });
});
