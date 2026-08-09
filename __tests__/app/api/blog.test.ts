import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getAal: vi.fn(),
  createBlogPost: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, mfa: { getAuthenticatorAssuranceLevel: mocks.getAal } },
  }),
}));

// Keeps the real `blogCategories` list (so category validation stays in
// sync with the actual module) while replacing only the Supabase-backed
// write.
vi.mock("@/lib/supabase/blogPosts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/blogPosts")>();
  return { ...actual, createBlogPost: mocks.createBlogPost };
});

// Keeps the real AUDIT_ACTIONS constants (so assertions below check the
// real action string) while replacing only the Supabase-backed write.
vi.mock("@/lib/auditLog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auditLog")>();
  return { ...actual, logAuditEvent: mocks.logAuditEvent };
});

function adminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin-1",
    is_anonymous: false,
    app_metadata: { role: "admin" },
    ...overrides,
  };
}

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/blog", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  category: "resumeTips",
  title: "How to write a resume",
  subtitle: "A practical guide",
  content: "Full article content.",
  authorName: "Jane Doe",
  authorAvatarUrl: "https://example.com/avatar.png",
  readTime: "5 min read",
  publishedAt: "2026-08-01T00:00:00.000Z",
};

const fakePost = { id: "post-1", slug: "how-to-write-a-resume", ...validBody };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: adminUser() } });
  mocks.getAal.mockResolvedValue({ data: { currentLevel: "aal2" } });
  mocks.createBlogPost.mockResolvedValue(fakePost);
});

describe("POST /api/blog — role-based authorization", () => {
  it("returns 403 when there is no logged-in user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(en.apiErrors.adminLoginRequired);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });

  it("returns 403 for an anonymous (guest) session, even if role were somehow set", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: adminUser({ is_anonymous: true }) },
    });

    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(en.apiErrors.adminLoginRequired);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });

  it("returns 403 for a logged-in user with no role set at all", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: adminUser({ app_metadata: {} }) },
    });

    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(en.apiErrors.adminLoginRequired);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });

  it.each(["user", "editor", "Admin", "ADMIN"])(
    "returns 403 for a role of %j (only the exact lowercase string 'admin' is accepted)",
    async (role) => {
      mocks.getUser.mockResolvedValue({
        data: { user: adminUser({ app_metadata: { role } }) },
      });

      const { POST } = await import("@/app/api/blog/route");
      const response = await POST(jsonRequest(validBody));

      expect(response.status).toBe(403);
      expect(mocks.createBlogPost).not.toHaveBeenCalled();
    },
  );

  it("allows a user with the admin role through", async () => {
    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(200);
    expect(mocks.createBlogPost).toHaveBeenCalledTimes(1);
  });

  it("returns 403 mfaRequired for an admin who hasn't completed a 2FA challenge this session", async () => {
    mocks.getAal.mockResolvedValue({ data: { currentLevel: "aal1" } });

    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(en.apiErrors.mfaRequired);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });
});

describe("POST /api/blog — input validation", () => {
  it.each([
    ["title", { ...validBody, title: "" }],
    ["subtitle", { ...validBody, subtitle: "   " }],
    ["content", { ...validBody, content: undefined }],
    ["authorName", { ...validBody, authorName: "" }],
    ["readTime", { ...validBody, readTime: undefined }],
    ["publishedAt", { ...validBody, publishedAt: "" }],
  ])("rejects a missing/blank %s", async (_field, body) => {
    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidInput);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });

  it("rejects a category that isn't one of the known blog categories", async () => {
    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest({ ...validBody, category: "not-a-real-category" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidInput);
  });

  it("rejects a malformed JSON body", async () => {
    const { POST } = await import("@/app/api/blog/route");
    const request = new Request("https://example.com/api/blog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidInput);
    expect(mocks.createBlogPost).not.toHaveBeenCalled();
  });
});

describe("POST /api/blog — create", () => {
  it("creates the post with trimmed fields and returns it", async () => {
    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(
      jsonRequest({
        ...validBody,
        title: "  How to write a resume  ",
        subtitle: "  A practical guide  ",
      }),
    );

    expect(mocks.createBlogPost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: "How to write a resume",
        subtitle: "A practical guide",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ post: fakePost });
  });

  it("logs an audit event for the created post", async () => {
    const { POST } = await import("@/app/api/blog/route");
    await POST(jsonRequest(validBody));

    expect(mocks.logAuditEvent).toHaveBeenCalledWith({
      userId: "admin-1",
      actorEmail: null,
      action: "blog.create",
      target: fakePost.slug,
      metadata: { title: fakePost.title, category: fakePost.category },
    });
  });

  it("stores a null authorAvatarUrl when none is given", async () => {
    const { POST } = await import("@/app/api/blog/route");
    await POST(jsonRequest({ ...validBody, authorAvatarUrl: undefined }));

    expect(mocks.createBlogPost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ authorAvatarUrl: null }),
    );
  });

  it("returns 500 when creating the post fails", async () => {
    mocks.createBlogPost.mockRejectedValue(new Error("insert failed"));

    const { POST } = await import("@/app/api/blog/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe(en.apiErrors.failedToCreatePost);
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });
});
