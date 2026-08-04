import JSZip from "jszip";
import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { generateCoverLetterDocx } from "@/lib/docx/coverLetterDocx";
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

async function documentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("word/document.xml missing from generated .docx");
  return file.async("string");
}

describe("generateCoverLetterDocx", () => {
  it("produces a valid, non-empty .docx (zip/OOXML) buffer", async () => {
    const doc = generateCoverLetterDocx({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
    });
    const buffer = await Packer.toBuffer(doc);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("ascii")).toBe("PK"); // zip magic bytes
  });

  it("includes the cover letter's actual content in the exported document", async () => {
    const doc = generateCoverLetterDocx({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
    });
    const xml = await documentXml(await Packer.toBuffer(doc));

    expect(xml).toContain("Jane Doe");
    expect(xml).toContain("Alex Recruiter");
    expect(xml).toContain("Acme Inc.");
    expect(xml).toContain("Subject: Application for Senior Frontend Engineer");
    expect(xml).toContain("Dear Alex,");
    expect(xml).toContain("I would love to bring my experience to your team.");
    expect(xml).toContain("Best regards,");
  });

  it("omits a field's content when it is excluded from visibleFields", async () => {
    const doc = generateCoverLetterDocx({
      data: coverLetterData,
      sectionOrder: defaultCoverLetterSectionOrder,
      visibleFields: ["senderName", "greeting", "body", "closing"], // excludes "subject"
    });
    const xml = await documentXml(await Packer.toBuffer(doc));

    expect(xml).not.toContain("Subject:");
    expect(xml).toContain("Dear Alex,");
  });

  it("renders no letter content at all when the letter fields are empty", async () => {
    const doc = generateCoverLetterDocx({
      data: { ...coverLetterData, greeting: "", body: "", closing: "" },
      sectionOrder: defaultCoverLetterSectionOrder,
    });
    const xml = await documentXml(await Packer.toBuffer(doc));

    // Sender/recipient/subject content should still be present...
    expect(xml).toContain("Jane Doe");
    expect(xml).toContain("Subject:");
    // ...but nothing from the now-empty letter section should appear.
    expect(xml).not.toContain("Dear Alex,");
    expect(xml).not.toContain("I would love to bring my experience to your team.");
    expect(xml).not.toContain("Best regards,");
  });
});
