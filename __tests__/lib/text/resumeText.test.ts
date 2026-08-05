import { describe, expect, it } from "vitest";
import { generateResumeText } from "@/lib/text/resumeText";
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
  phone: "+1 555 0100",
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

describe("generateResumeText", () => {
  it("includes the resume's actual content", () => {
    const text = generateResumeText({ data: resumeData, sectionOrder });

    expect(text).toContain("Jane Doe");
    expect(text).toContain("Senior Frontend Engineer");
    expect(text).toContain("Email: jane.doe@example.com");
    expect(text).toContain("Frontend engineer with 8 years of experience.");
    expect(text).toContain("TypeScript");
    expect(text).toContain("Led the migration to a component-driven design system.");
  });

  it("uppercases section headings", () => {
    const text = generateResumeText({ data: resumeData, sectionOrder });

    expect(text).toContain("WORK EXPERIENCE");
    expect(text).toContain("SKILLS");
    expect(text).toContain("ABOUT ME");
  });

  it("joins multiple contact fields on one line separated by '  |  '", () => {
    const text = generateResumeText({
      data: { ...resumeData, address: "123 Main St" },
      sectionOrder,
    });

    const contactLine = text.split("\n").find((line) => line.startsWith("Phone:"));
    expect(contactLine).toBe("Phone: +1 555 0100  |  Email: jane.doe@example.com  |  Address: 123 Main St");
  });

  it("omits a field's content when it is excluded from visibleFields", () => {
    const text = generateResumeText({
      data: resumeData,
      sectionOrder,
      visibleFields: ["email"], // deliberately excludes "name"
    });

    expect(text).not.toContain("Jane Doe");
    expect(text).toContain("jane.doe@example.com");
  });

  it("omits a section heading entirely when it has no content", () => {
    const text = generateResumeText({ data: resumeData, sectionOrder });

    expect(text).not.toContain("CERTIFICATIONS");
    expect(text).not.toContain("LANGUAGES");
    expect(text).not.toContain("INTERESTS");
  });

  it("uses a custom section title for customFields when one is set", () => {
    const text = generateResumeText({
      data: { ...resumeData, customFieldValue: "Slovak", customFieldsTitle: "Languages Spoken" },
      sectionOrder,
    });

    expect(text).toContain("LANGUAGES SPOKEN");
    expect(text).toContain("Slovak");
  });

  it("does not end with trailing blank lines", () => {
    const text = generateResumeText({ data: resumeData, sectionOrder });

    expect(text.endsWith("\n")).toBe(false);
    const lines = text.split("\n");
    expect(lines[lines.length - 1]).not.toBe("");
  });

  it("returns an empty string for completely empty data", () => {
    expect(generateResumeText({ data: emptyResumeData, sectionOrder })).toBe("");
  });
});
