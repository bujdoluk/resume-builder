import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { emptyResumeData, RESUME_SCHEMA_VERSION } from "@/lib/resumeData";
import {
  countDeletedResumes,
  countResumes,
  deleteResume,
  deleteResumes,
  disableResumeSharing,
  enableResumeSharing,
  getResume,
  getResumeByShareToken,
  listDeletedResumes,
  nextCopyName,
  permanentlyDeleteResume,
  permanentlyDeleteResumes,
  restoreResume,
  restoreResumes,
  saveResume,
  type SaveResumeParams,
} from "@/lib/supabase/resumes";

function createQueryBuilder(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    is: vi.fn(() => builder),
    not: vi.fn(() => builder),
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

const saveParams: SaveResumeParams = {
  id: null,
  userId: "user-1",
  name: "My Resume",
  templateId: "modern",
  color: "#123456",
  font: "inter",
  fontSize: "medium",
  sectionOrder: ["workExperience", "education", "skills", "certifications", "languages", "interests", "customFields"],
  visibleFields: ["name", "email"],
  modernSectionZones: { workExperience: "main" },
  data: { ...emptyResumeData, name: "Jane Doe" },
};

const fakeTableRow = {
  id: "resume-1",
  name: "My Resume",
  template_id: "modern",
  color: "#123456",
  font: "inter",
  font_size: "medium",
  section_order: saveParams.sectionOrder,
  visible_fields: saveParams.visibleFields,
  modern_section_zones: saveParams.modernSectionZones,
  data: { name: "Jane Doe" }, // deliberately partial, like an older saved row
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("nextCopyName", () => {
  it("appends (Copy) to a plain name", () => {
    expect(nextCopyName("My Resume")).toBe("My Resume (Copy)");
  });

  it("increments an existing (Copy) suffix", () => {
    expect(nextCopyName("My Resume (Copy)")).toBe("My Resume (Copy) 2");
  });

  it("increments a numbered (Copy) suffix", () => {
    expect(nextCopyName("My Resume (Copy) 2")).toBe("My Resume (Copy) 3");
  });
});

describe("saveResume", () => {
  it("inserts a new row when id is null", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    await saveResume(supabase, saveParams);

    expect(supabase.from).toHaveBeenCalledWith("resumes");
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        name: "My Resume",
        template_id: "modern",
        color: "#123456",
        font: "inter",
        font_size: "medium",
        section_order: saveParams.sectionOrder,
        visible_fields: saveParams.visibleFields,
        modern_section_zones: saveParams.modernSectionZones,
        data: { ...saveParams.data, __schemaVersion: RESUME_SCHEMA_VERSION },
      }),
    );
    expect(builder.update).not.toHaveBeenCalled();
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it("updates the existing row by id when id is present", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    await saveResume(supabase, { ...saveParams, id: "resume-1" });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", name: "My Resume" }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it("maps the saved row back to camelCase and fills in defaults for fields missing from the stored data", async () => {
    const { supabase } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await saveResume(supabase, saveParams);

    expect(row).toEqual({
      id: "resume-1",
      name: "My Resume",
      templateId: "modern",
      color: "#123456",
      font: "inter",
      fontSize: "medium",
      sectionOrder: saveParams.sectionOrder,
      visibleFields: saveParams.visibleFields,
      modernSectionZones: saveParams.modernSectionZones,
      data: { ...emptyResumeData, name: "Jane Doe" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("insert failed") });

    await expect(saveResume(supabase, saveParams)).rejects.toThrow("insert failed");
  });

  it("throws when Supabase returns no data and no error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(saveResume(supabase, saveParams)).rejects.toThrow("Failed to save resume");
  });
});

describe("getResume", () => {
  it("returns null when no row is found", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(getResume(supabase, "missing-id")).resolves.toBeNull();
  });

  it("filters out soft-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    await getResume(supabase, "resume-1");

    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("merges defaults into partially-saved data", async () => {
    const { supabase } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await getResume(supabase, "resume-1");

    expect(row?.data).toEqual({ ...emptyResumeData, name: "Jane Doe" });
  });

  it("defaults modernSectionZones to {} when null in the row", async () => {
    const { supabase } = createSupabaseMock({
      data: { ...fakeTableRow, modern_section_zones: null },
      error: null,
    });

    const row = await getResume(supabase, "resume-1");

    expect(row?.modernSectionZones).toEqual({});
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(getResume(supabase, "resume-1")).rejects.toThrow("select failed");
  });
});

describe("countResumes", () => {
  it("returns the count from Supabase", async () => {
    const { supabase, builder } = createSupabaseMock({ count: 3, error: null });

    await expect(countResumes(supabase, "user-1")).resolves.toBe(3);
    expect(builder.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("returns 0 when Supabase returns a null count", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: null });

    await expect(countResumes(supabase, "user-1")).resolves.toBe(0);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: new Error("count failed") });

    await expect(countResumes(supabase, "user-1")).rejects.toThrow("count failed");
  });
});

describe("enableResumeSharing", () => {
  it("generates a token and expiry and saves them via an owner-scoped update", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    const { token, expiresAt } = await enableResumeSharing(supabase, "resume-1");

    expect(supabase.from).toHaveBeenCalledWith("resumes");
    expect(builder.update).toHaveBeenCalledWith({ share_token: token, share_token_expires_at: expiresAt });
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("sets an expiry roughly 30 days in the future", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    const { expiresAt } = await enableResumeSharing(supabase, "resume-1");

    const daysUntilExpiry =
      (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilExpiry).toBeGreaterThan(29);
    expect(daysUntilExpiry).toBeLessThan(31);
  });

  it("generates a different token each time (invalidating any previous link)", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    const first = await enableResumeSharing(supabase, "resume-1");
    const second = await enableResumeSharing(supabase, "resume-1");

    expect(first.token).not.toBe(second.token);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(enableResumeSharing(supabase, "resume-1")).rejects.toThrow("update failed");
  });
});

describe("disableResumeSharing", () => {
  it("clears the share token and expiry via an owner-scoped update", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await disableResumeSharing(supabase, "resume-1");

    expect(builder.update).toHaveBeenCalledWith({ share_token: null, share_token_expires_at: null });
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(disableResumeSharing(supabase, "resume-1")).rejects.toThrow("update failed");
  });
});

describe("getResumeByShareToken", () => {
  it("looks up the resume by its share token, filtering out expired tokens", async () => {
    const { supabase, builder } = createSupabaseMock({ data: fakeTableRow, error: null });

    const row = await getResumeByShareToken(supabase, "a-token");

    expect(builder.eq).toHaveBeenCalledWith("share_token", "a-token");
    expect(builder.gt).toHaveBeenCalledWith("share_token_expires_at", expect.any(String));
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
    expect(row?.id).toBe("resume-1");
  });

  it("returns null when no resume matches the token", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: null });

    await expect(getResumeByShareToken(supabase, "missing-token")).resolves.toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(getResumeByShareToken(supabase, "a-token")).rejects.toThrow("select failed");
  });
});

describe("deleteResume", () => {
  it("soft-deletes via an owner-scoped update instead of removing the row", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await deleteResume(supabase, "resume-1");

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
        share_token: null,
        share_token_expires_at: null,
      }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(deleteResume(supabase, "resume-1")).rejects.toThrow("update failed");
  });
});

describe("deleteResumes", () => {
  it("soft-deletes every id in one owner-scoped update instead of removing the rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await deleteResumes(supabase, ["resume-1", "resume-2"]);

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
        share_token: null,
        share_token_expires_at: null,
      }),
    );
    expect(builder.in).toHaveBeenCalledWith("id", ["resume-1", "resume-2"]);
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(deleteResumes(supabase, ["resume-1"])).rejects.toThrow("update failed");
  });
});

describe("listDeletedResumes", () => {
  it("lists only soft-deleted rows, sorted by deletion date by default", async () => {
    const { supabase, builder } = createSupabaseMock({ data: [fakeTableRow], error: null });

    const rows = await listDeletedResumes(supabase, "user-1");

    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
    expect(builder.order).toHaveBeenCalledWith("deleted_at", { ascending: false });
    expect(rows).toHaveLength(1);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("select failed") });

    await expect(listDeletedResumes(supabase, "user-1")).rejects.toThrow("select failed");
  });
});

describe("countDeletedResumes", () => {
  it("counts only soft-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ count: 2, error: null });

    await expect(countDeletedResumes(supabase, "user-1")).resolves.toBe(2);
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
  });

  it("returns 0 when Supabase returns a null count", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: null });

    await expect(countDeletedResumes(supabase, "user-1")).resolves.toBe(0);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ count: null, error: new Error("count failed") });

    await expect(countDeletedResumes(supabase, "user-1")).rejects.toThrow("count failed");
  });
});

describe("restoreResume", () => {
  it("clears deleted_at via an owner-scoped update, only targeting already-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await restoreResume(supabase, "resume-1");

    expect(builder.update).toHaveBeenCalledWith({ deleted_at: null });
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(restoreResume(supabase, "resume-1")).rejects.toThrow("update failed");
  });
});

describe("restoreResumes", () => {
  it("clears deleted_at for every id in one owner-scoped update, only targeting already-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await restoreResumes(supabase, ["resume-1", "resume-2"]);

    expect(builder.update).toHaveBeenCalledWith({ deleted_at: null });
    expect(builder.in).toHaveBeenCalledWith("id", ["resume-1", "resume-2"]);
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("update failed") });

    await expect(restoreResumes(supabase, ["resume-1"])).rejects.toThrow("update failed");
  });
});

describe("permanentlyDeleteResume", () => {
  it("hard-deletes via an owner-scoped delete, only targeting already-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await permanentlyDeleteResume(supabase, "resume-1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
    expect(builder.update).not.toHaveBeenCalled();
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("delete failed") });

    await expect(permanentlyDeleteResume(supabase, "resume-1")).rejects.toThrow("delete failed");
  });
});

describe("permanentlyDeleteResumes", () => {
  it("hard-deletes every id in one owner-scoped delete, only targeting already-deleted rows", async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });

    await permanentlyDeleteResumes(supabase, ["resume-1", "resume-2"]);

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.in).toHaveBeenCalledWith("id", ["resume-1", "resume-2"]);
    expect(builder.not).toHaveBeenCalledWith("deleted_at", "is", null);
  });

  it("throws when Supabase returns an error", async () => {
    const { supabase } = createSupabaseMock({ data: null, error: new Error("delete failed") });

    await expect(permanentlyDeleteResumes(supabase, ["resume-1"])).rejects.toThrow("delete failed");
  });
});
