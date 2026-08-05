import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getConfigHealth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock("@/lib/configHealth", () => ({
  getConfigHealth: mocks.getConfigHealth,
}));

function adminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin-1",
    is_anonymous: false,
    app_metadata: { role: "admin" },
    ...overrides,
  };
}

function healthRequest(): Request {
  return new Request("https://example.com/api/admin/config-health", { method: "GET" });
}

const fakeHealth = {
  rateLimit: true,
  captcha: false,
  ai: true,
  email: true,
  sentry: true,
  cron: true,
  stripe: { secretKey: true, webhookSecret: true, monthlyPriceId: true, annualPriceId: true },
  supabase: { serviceRoleKey: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: adminUser() } });
  mocks.getConfigHealth.mockReturnValue(fakeHealth);
});

describe("GET /api/admin/config-health", () => {
  it("returns 403 when there is no logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/admin/config-health/route");
    const response = await GET(healthRequest());

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(en.apiErrors.adminLoginRequired);
    expect(mocks.getConfigHealth).not.toHaveBeenCalled();
  });

  it("returns 403 for an anonymous (guest) session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: adminUser({ is_anonymous: true }) } });

    const { GET } = await import("@/app/api/admin/config-health/route");
    const response = await GET(healthRequest());

    expect(response.status).toBe(403);
    expect(mocks.getConfigHealth).not.toHaveBeenCalled();
  });

  it.each(["user", "editor", "Admin"])(
    "returns 403 for a role of %j",
    async (role) => {
      mocks.getUser.mockResolvedValue({
        data: { user: adminUser({ app_metadata: { role } }) },
      });

      const { GET } = await import("@/app/api/admin/config-health/route");
      const response = await GET(healthRequest());

      expect(response.status).toBe(403);
      expect(mocks.getConfigHealth).not.toHaveBeenCalled();
    },
  );

  it("returns the config health report for an admin", async () => {
    const { GET } = await import("@/app/api/admin/config-health/route");
    const response = await GET(healthRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(fakeHealth);
    expect(mocks.getConfigHealth).toHaveBeenCalledTimes(1);
  });
});
