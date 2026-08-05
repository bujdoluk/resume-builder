import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fromEnv: vi.fn(),
  limit: vi.fn(),
  slidingWindow: vi.fn((requests: number, window: string) => ({ requests, window })),
  ratelimitConstructor: vi.fn(),
}));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: mocks.fromEnv },
}));

vi.mock("@upstash/ratelimit", () => {
  class FakeRatelimit {
    limit = mocks.limit;
    constructor(config: unknown) {
      mocks.ratelimitConstructor(config);
    }
    static slidingWindow = mocks.slidingWindow;
  }
  return { Ratelimit: FakeRatelimit };
});

// checkRateLimit lazily caches both the Redis client and each named limiter
// as module-level singletons, so env-var changes or mock reconfiguration
// only take effect on a freshly (re-)imported module instance.
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  mocks.fromEnv.mockReturnValue({});
  mocks.limit.mockResolvedValue({ success: true });
});

describe("checkRateLimit", () => {
  it("fails open (returns true) when Upstash isn't configured", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await expect(checkRateLimit("test", "user-1", 5, "10 m")).resolves.toBe(true);
    expect(mocks.fromEnv).not.toHaveBeenCalled();
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("returns true when the limiter reports success", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    mocks.limit.mockResolvedValue({ success: true });

    const { checkRateLimit } = await import("@/lib/rateLimit");
    const allowed = await checkRateLimit("test", "user-1", 5, "10 m");

    expect(allowed).toBe(true);
    expect(mocks.limit).toHaveBeenCalledWith("user-1");
    expect(mocks.slidingWindow).toHaveBeenCalledWith(5, "10 m");
  });

  it("returns false when the limiter reports failure", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    mocks.limit.mockResolvedValue({ success: false });

    const { checkRateLimit } = await import("@/lib/rateLimit");

    await expect(checkRateLimit("test", "user-1", 5, "10 m")).resolves.toBe(false);
  });

  it("builds one limiter per name and reuses it across identifiers", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const { checkRateLimit } = await import("@/lib/rateLimit");
    await checkRateLimit("test", "user-1", 5, "10 m");
    await checkRateLimit("test", "user-2", 5, "10 m");

    expect(mocks.ratelimitConstructor).toHaveBeenCalledTimes(1);
    expect(mocks.limit).toHaveBeenCalledTimes(2);
    expect(mocks.limit).toHaveBeenNthCalledWith(1, "user-1");
    expect(mocks.limit).toHaveBeenNthCalledWith(2, "user-2");
  });

  it("does not rebuild an already-cached limiter even if called again with different limits", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const { checkRateLimit } = await import("@/lib/rateLimit");
    await checkRateLimit("test", "user-1", 5, "10 m");
    await checkRateLimit("test", "user-2", 999, "1 s"); // same name, different limits

    // The second call's limits are silently ignored — the limiter built on
    // the first call for this name is reused as-is. Callers must always
    // pass the same (requests, window) for a given name, which every route
    // in this app does (the limits are constants).
    expect(mocks.slidingWindow).toHaveBeenCalledTimes(1);
    expect(mocks.slidingWindow).toHaveBeenCalledWith(5, "10 m");
  });

  it("builds a separate, distinctly-prefixed limiter per name", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const { checkRateLimit } = await import("@/lib/rateLimit");
    await checkRateLimit("name-a", "user-1", 5, "10 m");
    await checkRateLimit("name-b", "user-1", 5, "10 m");

    expect(mocks.ratelimitConstructor).toHaveBeenCalledTimes(2);
    expect(mocks.ratelimitConstructor).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ prefix: "ratelimit:name-a" }),
    );
    expect(mocks.ratelimitConstructor).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ prefix: "ratelimit:name-b" }),
    );
  });
});

describe("getRequestIp", () => {
  function requestWithForwardedFor(value: string | null): Request {
    const headers = new Headers();
    if (value !== null) headers.set("x-forwarded-for", value);
    return new Request("https://example.com/api/test", { headers });
  }

  it("returns the first IP from a comma-separated x-forwarded-for header", async () => {
    const { getRequestIp } = await import("@/lib/rateLimit");

    expect(getRequestIp(requestWithForwardedFor("203.0.113.1, 10.0.0.1, 10.0.0.2"))).toBe(
      "203.0.113.1",
    );
  });

  it("trims whitespace around the first IP", async () => {
    const { getRequestIp } = await import("@/lib/rateLimit");

    expect(getRequestIp(requestWithForwardedFor("  203.0.113.1  ,10.0.0.1"))).toBe("203.0.113.1");
  });

  it("returns 'unknown' when the header is missing", async () => {
    const { getRequestIp } = await import("@/lib/rateLimit");

    expect(getRequestIp(requestWithForwardedFor(null))).toBe("unknown");
  });

  it("returns 'unknown' when the header is blank", async () => {
    const { getRequestIp } = await import("@/lib/rateLimit");

    expect(getRequestIp(requestWithForwardedFor(""))).toBe("unknown");
  });
});
