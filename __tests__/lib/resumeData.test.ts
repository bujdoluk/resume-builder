import { describe, expect, it } from "vitest";
import {
  emptyResumeData,
  honorAwardEntrySchema,
  modernSectionZonesSchema,
  parseStoredResumeData,
  RESUME_SCHEMA_VERSION,
  resumeDataSchema,
  sectionOrderSchema,
  stampResumeData,
  workEntrySchema,
} from "@/lib/resumeData";

describe("resumeDataSchema", () => {
  it("parses a fully-valid object unchanged", () => {
    const data = { ...emptyResumeData, name: "Jane Doe", email: "jane@example.com" };
    expect(resumeDataSchema.parse(data)).toEqual(data);
  });

  it("fills in defaults field-by-field for a partial object, like the old shallow-merge did at the top level", () => {
    expect(resumeDataSchema.parse({ name: "Jane Doe" })).toEqual({
      ...emptyResumeData,
      name: "Jane Doe",
    });
  });

  it("recovers from a wrong-typed top-level field instead of throwing", () => {
    expect(resumeDataSchema.parse({ name: 12345, workExperience: "not an array" })).toEqual(
      emptyResumeData,
    );
  });

  it("recovers nested entry fields individually rather than dropping the whole entry", () => {
    const result = resumeDataSchema.parse({
      workExperience: [{ position: "Engineer", dateFrom: 42 }],
    });

    expect(result.workExperience).toHaveLength(1);
    const entry = result.workExperience[0]!;
    expect(entry.position).toBe("Engineer");
    expect(entry.dateFrom).toBe("");
    expect(entry.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("strips unknown keys (e.g. a schema-version marker) rather than failing", () => {
    expect(resumeDataSchema.parse({ __schemaVersion: 1, name: "Jane" })).toEqual({
      ...emptyResumeData,
      name: "Jane",
    });
  });
});

describe("workEntrySchema", () => {
  it("generates a fresh id when one is missing", () => {
    const result = workEntrySchema.parse({ position: "Engineer" });
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("generates a different id on each call", () => {
    const first = workEntrySchema.parse({});
    const second = workEntrySchema.parse({});
    expect(first.id).not.toBe(second.id);
  });

  it("keeps an existing id untouched", () => {
    expect(workEntrySchema.parse({ id: "custom-id" }).id).toBe("custom-id");
  });
});

describe("honorAwardEntrySchema", () => {
  it("generates a fresh id when one is missing", () => {
    const result = honorAwardEntrySchema.parse({ name: "Design Excellence Award" });
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps an existing id untouched", () => {
    expect(honorAwardEntrySchema.parse({ id: "custom-id" }).id).toBe("custom-id");
  });

  it("recovers from wrong-typed fields instead of throwing", () => {
    expect(honorAwardEntrySchema.parse({ name: 12345, issuer: null })).toMatchObject({
      name: "",
      issuer: "",
      dateFrom: "",
      dateTo: "",
    });
  });
});

describe("resumeDataSchema — Harvard-only bonus sections", () => {
  it("defaults leadershipExperience and honorsAwards to empty arrays", () => {
    expect(emptyResumeData.leadershipExperience).toEqual([]);
    expect(emptyResumeData.honorsAwards).toEqual([]);
  });

  it("parses leadershipExperience with the same shape as workExperience", () => {
    const result = resumeDataSchema.parse({
      leadershipExperience: [{ position: "Club President", dateFrom: 42 }],
    });
    expect(result.leadershipExperience).toHaveLength(1);
    expect(result.leadershipExperience[0]!.position).toBe("Club President");
    expect(result.leadershipExperience[0]!.dateFrom).toBe("");
  });

  it("recovers honorsAwards entry fields individually rather than dropping the whole entry", () => {
    const result = resumeDataSchema.parse({
      honorsAwards: [{ name: "Dean's List", issuer: 999 }],
    });
    expect(result.honorsAwards).toHaveLength(1);
    expect(result.honorsAwards[0]!.name).toBe("Dean's List");
    expect(result.honorsAwards[0]!.issuer).toBe("");
  });
});

describe("sectionOrderSchema", () => {
  it("passes through a fully-valid order", () => {
    expect(sectionOrderSchema.parse(["education", "skills"])).toEqual(["education", "skills"]);
  });

  it("drops individually-invalid entries, keeping the rest in order", () => {
    expect(sectionOrderSchema.parse(["education", "not-a-real-section", "skills"])).toEqual([
      "education",
      "skills",
    ]);
  });

  it("falls back to an empty order for non-array input", () => {
    expect(sectionOrderSchema.parse("not an array")).toEqual([]);
    expect(sectionOrderSchema.parse(null)).toEqual([]);
  });
});

describe("modernSectionZonesSchema", () => {
  it("keeps valid key/zone pairs", () => {
    expect(modernSectionZonesSchema.parse({ workExperience: "sidebar", aboutMe: "main" })).toEqual({
      workExperience: "sidebar",
      aboutMe: "main",
    });
  });

  it("drops entries with an unknown key or an invalid zone value", () => {
    expect(
      modernSectionZonesSchema.parse({
        workExperience: "sidebar",
        notARealKey: "main",
        education: "not-a-real-zone",
      }),
    ).toEqual({ workExperience: "sidebar" });
  });

  it("falls back to {} for null or non-object input", () => {
    expect(modernSectionZonesSchema.parse(null)).toEqual({});
    expect(modernSectionZonesSchema.parse("nope")).toEqual({});
  });
});

describe("stampResumeData / parseStoredResumeData round trip", () => {
  it("stamps the current schema version on write and strips it back off on read", () => {
    const data = { ...emptyResumeData, name: "Jane Doe" };

    const stamped = stampResumeData(data);
    expect(stamped).toMatchObject({ name: "Jane Doe", __schemaVersion: RESUME_SCHEMA_VERSION });

    expect(parseStoredResumeData(stamped)).toEqual(data);
  });

  it("treats a legacy row with no version marker at all as still readable", () => {
    expect(parseStoredResumeData({ name: "Legacy Jane" })).toEqual({
      ...emptyResumeData,
      name: "Legacy Jane",
    });
  });

  it("never throws on completely garbage stored data", () => {
    expect(parseStoredResumeData(null)).toEqual(emptyResumeData);
    expect(parseStoredResumeData("garbage")).toEqual(emptyResumeData);
    expect(parseStoredResumeData(42)).toEqual(emptyResumeData);
  });
});
