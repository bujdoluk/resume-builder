import { describe, expect, it } from "vitest";
import { checkResumeFormat } from "@/lib/atsChecker/checkResumeFormat";
import { emptyResumeData, type ResumeData } from "@/lib/resumeData";

function passed(data: ResumeData, id: string, templateId: Parameters<typeof checkResumeFormat>[1] = "basic") {
  return checkResumeFormat(data, templateId).find((check) => check.id === id)?.passed;
}

const fullyFilled: ResumeData = {
  ...emptyResumeData,
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555 0100",
  aboutMe: "Frontend engineer with 8 years of experience.",
  workExperience: [
    {
      id: "w1",
      position: "Senior Frontend Engineer",
      dateFrom: "06-2020",
      dateTo: "Present",
      location: "Remote",
      jobDescription: "Improved page load time by 30%.",
    },
  ],
  skills: [{ id: "s1", value: "TypeScript" }],
  certifications: [{ id: "c1", name: "AWS Certified", dateFrom: "2021", dateTo: "" }],
  languages: [{ id: "l1", language: "English", level: "Native Speaker" }],
};

describe("checkResumeFormat", () => {
  it("passes every check for fully-filled data on a single-column template", () => {
    const checks = checkResumeFormat(fullyFilled, "basic");

    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it.each(["modern", "elegant"] as const)(
    "fails singleColumnTemplate for the %s (multi-column) template",
    (templateId) => {
      expect(passed(fullyFilled, "singleColumnTemplate", templateId)).toBe(false);
    },
  );

  it.each(["basic", "minimal", "classic"] as const)(
    "passes singleColumnTemplate for the %s (single-column) template",
    (templateId) => {
      expect(passed(fullyFilled, "singleColumnTemplate", templateId)).toBe(true);
    },
  );

  it("fails hasName/hasEmail/hasPhone/hasSummary when those fields are blank or whitespace-only", () => {
    const blank: ResumeData = { ...fullyFilled, name: "  ", email: "", phone: "   ", aboutMe: "" };

    expect(passed(blank, "hasName")).toBe(false);
    expect(passed(blank, "hasEmail")).toBe(false);
    expect(passed(blank, "hasPhone")).toBe(false);
    expect(passed(blank, "hasSummary")).toBe(false);
  });

  it("only counts a work entry as filled by its position field, not other fields", () => {
    const noPosition: ResumeData = {
      ...fullyFilled,
      workExperience: [
        {
          id: "w1",
          position: "  ", // blank position — should not count as filled...
          dateFrom: "06-2020",
          dateTo: "Present",
          location: "Remote",
          jobDescription: "Improved page load time by 30%.", // ...even though other fields are set
        },
      ],
    };

    expect(passed(noPosition, "hasWorkExperience")).toBe(false);
  });

  it("passes workDatesComplete vacuously when there is no filled work experience", () => {
    expect(passed(emptyResumeData, "workDatesComplete")).toBe(true);
  });

  it("fails workDatesComplete when any filled entry is missing a start or end date", () => {
    const missingDate: ResumeData = {
      ...fullyFilled,
      workExperience: [{ ...fullyFilled.workExperience[0], dateTo: "" }],
    };

    expect(passed(missingDate, "workDatesComplete")).toBe(false);
  });

  it("fails hasQuantifiedAchievements when there is no filled work experience at all", () => {
    expect(passed(emptyResumeData, "hasQuantifiedAchievements")).toBe(false);
  });

  it("fails hasQuantifiedAchievements when no job description mentions a number or percentage", () => {
    const noNumbers: ResumeData = {
      ...fullyFilled,
      workExperience: [
        { ...fullyFilled.workExperience[0], jobDescription: "Led the frontend team." },
      ],
    };

    expect(passed(noNumbers, "hasQuantifiedAchievements")).toBe(false);
  });

  it("passes hasQuantifiedAchievements for a plain digit, not just a percentage", () => {
    const withDigit: ResumeData = {
      ...fullyFilled,
      workExperience: [
        { ...fullyFilled.workExperience[0], jobDescription: "Managed a team of 5 engineers." },
      ],
    };

    expect(passed(withDigit, "hasQuantifiedAchievements")).toBe(true);
  });

  it("fails hasSkills/hasCertifications/hasLanguages when their entries are only whitespace", () => {
    const blankEntries: ResumeData = {
      ...fullyFilled,
      skills: [{ id: "s1", value: "  " }],
      certifications: [{ id: "c1", name: "  ", dateFrom: "", dateTo: "" }],
      languages: [{ id: "l1", language: "  ", level: "Beginner" }],
    };

    expect(passed(blankEntries, "hasSkills")).toBe(false);
    expect(passed(blankEntries, "hasCertifications")).toBe(false);
    expect(passed(blankEntries, "hasLanguages")).toBe(false);
  });
});
