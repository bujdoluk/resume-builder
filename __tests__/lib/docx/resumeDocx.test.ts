import JSZip from "jszip";
import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { generateResumeDocx } from "@/lib/docx/resumeDocx";
import { emptyResumeData, type ResumeData, type SectionKey } from "@/lib/resumeData";

const sectionOrder: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "certifications",
  "languages",
  "interests",
  "customFields",
];

const resumeData: ResumeData = {
  ...emptyResumeData,
  name: "Jane Doe",
  jobTitle: "Senior Frontend Engineer",
  email: "jane.doe@example.com",
  aboutMe: "Frontend engineer with 8 years of experience.",
  workExperience: [
    {
      id: "w1",
      position: "Senior Frontend Engineer",
      dateFrom: "06-2020",
      dateTo: "Present",
      location: "Remote",
      jobDescription: "Led the migration to a component-driven design system.",
    },
  ],
  skills: [{ id: "s1", value: "TypeScript" }],
};

async function documentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("word/document.xml missing from generated .docx");
  return file.async("string");
}

describe("generateResumeDocx", () => {
  it("produces a valid, non-empty .docx (zip/OOXML) buffer", async () => {
    const doc = generateResumeDocx({ data: resumeData, sectionOrder });
    const buffer = await Packer.toBuffer(doc);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("ascii")).toBe("PK"); // zip magic bytes
  });

  it("includes the resume's actual content in the exported document", async () => {
    const doc = generateResumeDocx({ data: resumeData, sectionOrder });
    const xml = await documentXml(await Packer.toBuffer(doc));

    expect(xml).toContain("Jane Doe");
    expect(xml).toContain("Senior Frontend Engineer");
    expect(xml).toContain("jane.doe@example.com");
    expect(xml).toContain("Frontend engineer with 8 years of experience.");
    expect(xml).toContain("TypeScript");
    expect(xml).toContain("Led the migration to a component-driven design system.");
    expect(xml).toContain("Work Experience");
    expect(xml).toContain("Skills");
  });

  it("omits a field's content when it is excluded from visibleFields", async () => {
    const doc = generateResumeDocx({
      data: resumeData,
      sectionOrder,
      visibleFields: ["email"], // deliberately excludes "name"
    });
    const xml = await documentXml(await Packer.toBuffer(doc));

    expect(xml).not.toContain("Jane Doe");
    expect(xml).toContain("jane.doe@example.com");
  });

  it("omits a section heading entirely when it has no content", async () => {
    const doc = generateResumeDocx({
      data: resumeData, // certifications, languages, interests are all empty
      sectionOrder,
    });
    const xml = await documentXml(await Packer.toBuffer(doc));

    expect(xml).not.toContain("Certifications");
    expect(xml).not.toContain("Languages");
    expect(xml).not.toContain("Interests");
  });
});
