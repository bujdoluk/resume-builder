import { describe, expect, it } from "vitest";
import { generateCoverLetterText } from "@/lib/text/coverLetterText";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { defaultCoverLetterSectionOrder } from "@/lib/coverLetterSections";

const coverLetterData: CoverLetterData = {
  ...emptyCoverLetterData,
  senderName: "Jane Doe",
  senderEmail: "jane.doe@example.com",
  recipientName: "Alex Recruiter",
  recipientCompany: "Acme Inc.",
  subject: "Application for Senior Frontend Engineer",
  greeting: "Dear Alex,",
  body: "I would love to bring my experience to your team.",
  closing: "Best regards,",
};

describe("generateCoverLetterText", () => {
  it("includes the cover letter's actual content", () => {
    const text = generateCoverLetterText({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
    });

    expect(text).toContain("Jane Doe");
    expect(text).toContain("Alex Recruiter");
    expect(text).toContain("Acme Inc.");
    expect(text).toContain("Subject: Application for Senior Frontend Engineer");
    expect(text).toContain("Dear Alex,");
    expect(text).toContain("I would love to bring my experience to your team.");
    expect(text).toContain("Best regards,");
  });

  it("separates sections with exactly one blank line, and starts with no leading blank line", () => {
    const text = generateCoverLetterText({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
    });
    const lines = text.split("\n");

    expect(lines[0]).toBe("Jane Doe");
    expect(text).not.toContain("\n\n\n");
  });

  it("reuses senderName for the signature line at the end of the letter", () => {
    const text = generateCoverLetterText({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
    });
    const lines = text.split("\n");

    expect(lines[lines.length - 1]).toBe("Jane Doe");
  });

  it("omits a field's content when it is excluded from visibleFields", () => {
    const text = generateCoverLetterText({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
      visibleFields: ["senderName", "greeting", "body", "closing"], // excludes "subject"
    });

    expect(text).not.toContain("Subject:");
    expect(text).toContain("Dear Alex,");
  });

  it("omits a section entirely when none of its fields are filled", () => {
    const text = generateCoverLetterText({
      data: { ...coverLetterData, recipientName: "", recipientCompany: "" },
      sectionOrder: defaultCoverLetterSectionOrder,
    });

    expect(text).not.toContain("Acme Inc.");
    expect(text).not.toContain("Alex Recruiter");
  });

  it("returns an empty string for completely empty data", () => {
    expect(
      generateCoverLetterText({
        data: emptyCoverLetterData,
        sectionOrder: defaultCoverLetterSectionOrder,
      }),
    ).toBe("");
  });
});
