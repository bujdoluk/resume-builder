import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkDatabase: vi.fn(),
  checkRedis: vi.fn(),
}));

vi.mock("@/lib/health", () => ({
  checkDatabase: mocks.checkDatabase,
  checkRedis: mocks.checkRedis,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkDatabase.mockResolvedValue({ ok: true, latencyMs: 10 });
  mocks.checkRedis.mockResolvedValue({ ok: true, latencyMs: 5 });
});

describe("GET /api/health", () => {
  it("returns 200 with an ok status and a fresh timestamp, uncached, when every check passes", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.status).toBe("ok");
    expect(body.checks).toEqual({
      db: { ok: true, latencyMs: 10 },
      redis: { ok: true, latencyMs: 5 },
    });
    expect(() => Temporal.Instant.from(body.timestamp)).not.toThrow();
  });

  it("returns 200 with a degraded status when only Redis is down", async () => {
    mocks.checkRedis.mockResolvedValue({ ok: false, latencyMs: null });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
  });

  it("returns 503 with a down status when the database check fails", async () => {
    mocks.checkDatabase.mockResolvedValue({ ok: false, latencyMs: null });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
  });

  it("returns 503 when the database is down even if Redis is also down", async () => {
    mocks.checkDatabase.mockResolvedValue({ ok: false, latencyMs: null });
    mocks.checkRedis.mockResolvedValue({ ok: false, latencyMs: null });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);
    expect((await response.json()).status).toBe("down");
  });
});
