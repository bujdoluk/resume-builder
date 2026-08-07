import { describe, expect, it } from "vitest";
import {
  COVER_LETTER_SCHEMA_VERSION,
  coverLetterDataSchema,
  emptyCoverLetterData,
  parseStoredCoverLetterData,
  stampCoverLetterData,
} from "@/lib/coverLetterData";

describe("coverLetterDataSchema", () => {
  it("parses a fully-valid object unchanged", () => {
    const data = { ...emptyCoverLetterData, senderName: "Jane Doe" };
    expect(coverLetterDataSchema.parse(data)).toEqual(data);
  });

  it("fills in defaults for a partial object, like the old shallow-merge did", () => {
    expect(coverLetterDataSchema.parse({ senderName: "Jane Doe" })).toEqual({
      ...emptyCoverLetterData,
      senderName: "Jane Doe",
    });
  });

  it("recovers from a wrong-typed field instead of throwing", () => {
    expect(coverLetterDataSchema.parse({ senderName: 12345 })).toEqual(emptyCoverLetterData);
  });
});

describe("stampCoverLetterData / parseStoredCoverLetterData round trip", () => {
  it("stamps the current schema version on write and strips it back off on read", () => {
    const data = { ...emptyCoverLetterData, senderName: "Jane Doe" };

    const stamped = stampCoverLetterData(data);
    expect(stamped).toMatchObject({ senderName: "Jane Doe", __schemaVersion: COVER_LETTER_SCHEMA_VERSION });

    expect(parseStoredCoverLetterData(stamped)).toEqual(data);
  });

  it("treats a legacy row with no version marker at all as still readable", () => {
    expect(parseStoredCoverLetterData({ senderName: "Legacy Jane" })).toEqual({
      ...emptyCoverLetterData,
      senderName: "Legacy Jane",
    });
  });

  it("never throws on completely garbage stored data", () => {
    expect(parseStoredCoverLetterData(null)).toEqual(emptyCoverLetterData);
    expect(parseStoredCoverLetterData("garbage")).toEqual(emptyCoverLetterData);
  });
});
