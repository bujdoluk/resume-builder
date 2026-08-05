import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { emptyCoverLetterData } from "@/lib/coverLetterData";
import {
  countCoverLetters,
  disableCoverLetterSharing,
  enableCoverLetterSharing,
  getCoverLetter,
  getCoverLetterByShareToken,
  saveCoverLetter,
  type SaveCoverLetterParams,
} from "@/lib/supabase/coverLetters";

// A minimal fake of supabase-js's fluent query builder: every chain method
// returns the same object, and the object is directly awaitable (mirroring
// how the real builder resolves without an explicit terminal call in
// countCoverLetters) as well as exposing .single()/.maybeSingle() terminals.
function createQueryBuilder(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };
  return builder;
}

function createSupabaseMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const builder = createQueryBuilder(result);
  const from = vi.fn(() => builder);
  return { supabase: { from } as unknown as SupabaseClient, builder };
}

const saveParams: SaveCoverLetterParams = {
  id: null,
  userId: "user-1",
  name: "My Cover Letter",
  data: { ...emptyCoverLetterData, senderName: "Jane Doe" },
};

const fakeTableRow = {
  id: "cover-letter-1",
  name: "My Cover Letter",
  data: { senderName: "Jane Doe" }, // deliberately partial, like an older saved row
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("saveCoverLetter", () => {
  it("inserts a new row when id is null", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    await saveCoverLetter(supabase, saveParams);

    expect(supabase.from).toHaveBeenCalledWith("cover_letters");
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        name: "My Cover Letter",
        data: saveParams.data,
      }),
    );
    expect(builder.update).not.toHaveBeenCalled();
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it("updates the existing row by id when id is present", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    await saveCoverLetter(supabase, { ...saveParams, id: "cover-letter-1" });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", name: "My Cover Letter" }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "cover-letter-1");
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it("maps the saved row back to camelCase and fills in defaults for fields missing from the stored data", async () => {
    const { supabase } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await saveCoverLetter(supabase, saveParams);

    expect(row).toEqual({
      id: "cover-letter-1",
      name: "My Cover Letter",
      // fakeTableRow.data only has `senderName` — everything else must come
      // from emptyCoverLetterData rather than being missing/undefined.
      data: { ...emptyCoverLetterData, senderName: "Jane Doe" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("insert failed") });

    await expect(saveCoverLetter(supabase, saveParams)).rejects.toThrow("insert failed");
  });

  it("throws when Supabase returns no data and no error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(saveCoverLetter(supabase, saveParams)).rejects.toThrow(
      "Failed to save cover letter",
    );
  });
});

describe("getCoverLetter", () => {
  it("returns null when no row is found", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(getCoverLetter(supabase, "missing-id")).resolves.toBeNull();
  });

  it("merges defaults into partially-saved data", async () => {
    const { supabase } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await getCoverLetter(supabase, "cover-letter-1");

    expect(row?.data).toEqual({ ...emptyCoverLetterData, senderName: "Jane Doe" });
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(getCoverLetter(supabase, "cover-letter-1")).rejects.toThrow("select failed");
  });
});

describe("countCoverLetters", () => {
  it("returns the count from Supabase", async () => {
    const { supabase, builder } = createSupabaseMock({ count: 2, error: null });

    await expect(countCoverLetters(supabase, "user-1")).resolves.toBe(2);
    expect(builder.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns 0 when Supabase returns a null count", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: null });

    await expect(countCoverLetters(supabase, "user-1")).resolves.toBe(0);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: new Error("count failed") });

    await expect(countCoverLetters(supabase, "user-1")).rejects.toThrow("count failed");
  });
});

describe("enableCoverLetterSharing", () => {
  it("generates a token and expiry and saves them via an owner-scoped update", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    const { token, expiresAt } = await enableCoverLetterSharing(supabase, "cover-letter-1");

    expect(supabase.from).toHaveBeenCalledWith("cover_letters");
    expect(builder.update).toHaveBeenCalledWith({ share_token: token, share_token_expires_at: expiresAt });
    expect(builder.eq).toHaveBeenCalledWith("id", "cover-letter-1");
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("sets an expiry roughly 30 days in the future", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    const { expiresAt } = await enableCoverLetterSharing(supabase, "cover-letter-1");

    const daysUntilExpiry =
      (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilExpiry).toBeGreaterThan(29);
    expect(daysUntilExpiry).toBeLessThan(31);
  });

  it("generates a different token each time (invalidating any previous link)", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    const first = await enableCoverLetterSharing(supabase, "cover-letter-1");
    const second = await enableCoverLetterSharing(supabase, "cover-letter-1");

    expect(first.token).not.toBe(second.token);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(enableCoverLetterSharing(supabase, "cover-letter-1")).rejects.toThrow(
      "update failed",
    );
  });
});

describe("disableCoverLetterSharing", () => {
  it("clears the share token and expiry via an owner-scoped update", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await disableCoverLetterSharing(supabase, "cover-letter-1");

    expect(builder.update).toHaveBeenCalledWith({ share_token: null, share_token_expires_at: null });
    expect(builder.eq).toHaveBeenCalledWith("id", "cover-letter-1");
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(disableCoverLetterSharing(supabase, "cover-letter-1")).rejects.toThrow(
      "update failed",
    );
  });
});

describe("getCoverLetterByShareToken", () => {
  it("looks up the cover letter by its share token, filtering out expired tokens", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await getCoverLetterByShareToken(supabase, "a-token");

    expect(builder.eq).toHaveBeenCalledWith("share_token", "a-token");
    expect(builder.gt).toHaveBeenCalledWith("share_token_expires_at", expect.any(String));
    expect(row?.id).toBe("cover-letter-1");
  });

  it("returns null when no cover letter matches the token", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(getCoverLetterByShareToken(supabase, "missing-token")).resolves.toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(getCoverLetterByShareToken(supabase, "a-token")).rejects.toThrow("select failed");
  });
});
