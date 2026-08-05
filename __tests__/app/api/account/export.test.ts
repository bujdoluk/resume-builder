import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  listAllResumes: vi.fn(),
  listAllCoverLetters: vi.fn(),
  getSubscription: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/supabase/resumes", () => ({
  listAllResumes: mocks.listAllResumes,
}));

vi.mock("@/lib/supabase/coverLetters", () => ({
  listAllCoverLetters: mocks.listAllCoverLetters,
}));

vi.mock("@/lib/supabase/subscriptions", () => ({
  getSubscription: mocks.getSubscription,
}));

const fakeUser = {
  id: "user-1",
  email: "jane@example.com",
  is_anonymous: false,
  created_at: "2025-01-01T00:00:00.000Z",
};

const fakeResumes = [{ id: "resume-1", name: "My Resume" }];
const fakeCoverLetters = [{ id: "cover-letter-1", name: "My Cover Letter" }];
const fakeSubscription = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: "2026-09-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
};

function exportRequest(): Request {
  return new Request("https://example.com/api/account/export", { method: "GET" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: fakeUser } });
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.listAllResumes.mockResolvedValue(fakeResumes);
  mocks.listAllCoverLetters.mockResolvedValue(fakeCoverLetters);
  mocks.getSubscription.mockResolvedValue(fakeSubscription);
});

describe("GET /api/account/export", () => {
  it("requires a logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/account/export/route");
    const response = await GET(exportRequest());

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.listAllResumes).not.toHaveBeenCalled();
  });

  it("blocks anonymous (guest) sessions", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...fakeUser, is_anonymous: true } } });

    const { GET } = await import("@/app/api/account/export/route");
    const response = await GET(exportRequest());

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe(en.apiErrors.loginRequired);
  });

  it("returns 429 and fetches nothing when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { GET } = await import("@/app/api/account/export/route");
    const response = await GET(exportRequest());

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.listAllResumes).not.toHaveBeenCalled();
    expect(mocks.listAllCoverLetters).not.toHaveBeenCalled();
    expect(mocks.getSubscription).not.toHaveBeenCalled();
  });

  it("fetches every data source scoped to the requesting user", async () => {
    const { GET } = await import("@/app/api/account/export/route");
    await GET(exportRequest());

    expect(mocks.listAllResumes).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(mocks.listAllCoverLetters).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(mocks.getSubscription).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("aggregates all four pieces of data into the export payload without dropping any", async () => {
    const { GET } = await import("@/app/api/account/export/route");
    const response = await GET(exportRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.account).toEqual({ email: "jane@example.com", createdAt: fakeUser.created_at });
    expect(body.subscription).toEqual(fakeSubscription);
    expect(body.resumes).toEqual(fakeResumes);
    expect(body.coverLetters).toEqual(fakeCoverLetters);
    expect(typeof body.exportedAt).toBe("string");
    expect(() => Temporal.Instant.from(body.exportedAt)).not.toThrow();
  });
});
