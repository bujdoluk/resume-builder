import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns 200 with an ok status and a fresh timestamp, uncached", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.status).toBe("ok");
    expect(() => Temporal.Instant.from(body.timestamp)).not.toThrow();
  });
});
