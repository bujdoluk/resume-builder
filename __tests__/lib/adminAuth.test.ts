import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import en from "@/lib/i18n/locales/en.json";
import { requireAdmin } from "@/lib/adminAuth";

function adminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin-1",
    is_anonymous: false,
    app_metadata: { role: "admin" },
    ...overrides,
  };
}

function fakeSupabase(
  user: unknown,
  aal: { currentLevel: string | null } | null = { currentLevel: "aal2" },
): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(() => Promise.resolve({ data: aal })),
      },
    },
  } as unknown as SupabaseClient;
}

function fakeRequest(): Request {
  return new Request("https://example.com/api/admin/whatever");
}

describe("requireAdmin", () => {
  it("returns a 403 adminLoginRequired response when there is no user", async () => {
    const supabase = fakeSupabase(null);

    const result = await requireAdmin(supabase, fakeRequest());

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
    expect(await (result as Response).json()).toEqual({ error: en.apiErrors.adminLoginRequired });
  });

  it("returns a 403 adminLoginRequired response for an anonymous session", async () => {
    const supabase = fakeSupabase(adminUser({ is_anonymous: true }));

    const result = await requireAdmin(supabase, fakeRequest());

    expect((result as Response).status).toBe(403);
    expect(await (result as Response).json()).toEqual({ error: en.apiErrors.adminLoginRequired });
  });

  it("returns a 403 adminLoginRequired response for a non-admin role", async () => {
    const supabase = fakeSupabase(adminUser({ app_metadata: { role: "user" } }));

    const result = await requireAdmin(supabase, fakeRequest());

    expect((result as Response).status).toBe(403);
    expect(await (result as Response).json()).toEqual({ error: en.apiErrors.adminLoginRequired });
  });

  it("returns a 403 mfaRequired response for an admin without a completed aal2 challenge", async () => {
    const supabase = fakeSupabase(adminUser(), { currentLevel: "aal1" });

    const result = await requireAdmin(supabase, fakeRequest());

    expect((result as Response).status).toBe(403);
    expect(await (result as Response).json()).toEqual({ error: en.apiErrors.mfaRequired });
  });

  it("returns the user for an admin with a completed aal2 challenge", async () => {
    const user = adminUser();
    const supabase = fakeSupabase(user, { currentLevel: "aal2" });

    const result = await requireAdmin(supabase, fakeRequest());

    expect(result).toEqual(user);
  });
});
