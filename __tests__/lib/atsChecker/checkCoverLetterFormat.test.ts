import { describe, expect, it } from "vitest";
import { checkCoverLetterFormat } from "@/lib/atsChecker/checkCoverLetterFormat";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { MIN_COVER_LETTER_BODY_LENGTH } from "@/lib/constants";

function passed(
  data: CoverLetterData,
  id: string,
  templateId: Parameters<typeof checkCoverLetterFormat>[1] = "basic",
) {
  return checkCoverLetterFormat(data, templateId).find((check) => check.id === id)?.passed;
}

const longBody = "a".repeat(MIN_COVER_LETTER_BODY_LENGTH);

const fullyFilled: CoverLetterData = {
  ...emptyCoverLetterData,
  senderEmail: "jane@example.com",
  senderPhone: "+1 555 0100",
  recipientName: "Alex Recruiter",
  recipientCompany: "Acme Inc.",
  subject: "Application for Senior Frontend Engineer",
  body: `${longBody} I improved performance by 30%.`,
};

describe("checkCoverLetterFormat", () => {
  it("passes every check for fully-filled data on a single-column template", () => {
    const checks = checkCoverLetterFormat(fullyFilled, "basic");

    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("fails singleColumnTemplate for the modern (multi-column) template", () => {
    expect(passed(fullyFilled, "singleColumnTemplate", "modern")).toBe(false);
  });

  it("passes singleColumnTemplate for the basic (single-column) template", () => {
    expect(passed(fullyFilled, "singleColumnTemplate", "basic")).toBe(true);
  });

  it("requires BOTH senderEmail and senderPhone for hasSenderContact — either alone doesn't count", () => {
    expect(passed({ ...fullyFilled, senderPhone: "" }, "hasSenderContact")).toBe(false);
    expect(passed({ ...fullyFilled, senderEmail: "" }, "hasSenderContact")).toBe(false);
    expect(
      passed({ ...fullyFilled, senderEmail: "  ", senderPhone: "  " }, "hasSenderContact"),
    ).toBe(false);
  });

  it("accepts EITHER recipientName or recipientCompany alone for hasRecipientInfo", () => {
    expect(passed({ ...fullyFilled, recipientCompany: "" }, "hasRecipientInfo")).toBe(true);
    expect(passed({ ...fullyFilled, recipientName: "" }, "hasRecipientInfo")).toBe(true);
    expect(
      passed({ ...fullyFilled, recipientName: "", recipientCompany: "" }, "hasRecipientInfo"),
    ).toBe(false);
  });

  it("fails hasSubject when the subject is blank or whitespace-only", () => {
    expect(passed({ ...fullyFilled, subject: "   " }, "hasSubject")).toBe(false);
  });

  it("enforces the exact MIN_COVER_LETTER_BODY_LENGTH boundary for bodyLongEnough", () => {
    const exactlyMinLength = { ...fullyFilled, body: "a".repeat(MIN_COVER_LETTER_BODY_LENGTH) };
    const oneCharShort = { ...fullyFilled, body: "a".repeat(MIN_COVER_LETTER_BODY_LENGTH - 1) };

    expect(passed(exactlyMinLength, "bodyLongEnough")).toBe(true);
    expect(passed(oneCharShort, "bodyLongEnough")).toBe(false);
  });

  it("does not count surrounding whitespace towards the body length", () => {
    const paddedButShort = {
      ...fullyFilled,
      body: `  ${"a".repeat(MIN_COVER_LETTER_BODY_LENGTH - 1)}  `,
    };

    expect(passed(paddedButShort, "bodyLongEnough")).toBe(false);
  });

  it("fails hasQuantifiedContent when the body has no number or percentage", () => {
    expect(
      passed({ ...fullyFilled, body: "a".repeat(MIN_COVER_LETTER_BODY_LENGTH) }, "hasQuantifiedContent"),
    ).toBe(false);
  });

  it("passes hasQuantifiedContent for a plain digit, not just a percentage", () => {
    expect(
      passed(
        { ...fullyFilled, body: `${"a".repeat(MIN_COVER_LETTER_BODY_LENGTH)} 5 years` },
        "hasQuantifiedContent",
      ),
    ).toBe(true);
  });
});
