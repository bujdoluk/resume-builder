import { describe, expect, it } from "vitest";
import type { SectionKey } from "@/lib/resumeData";
import {
  getDefaultSectionOrder,
  sectionOrderForTemplate,
  standardSectionOrder,
} from "@/lib/sectionOrder";

const harvardOrder: SectionKey[] = [
  "skills",
  "workExperience",
  "education",
  "languages",
  "certifications",
  "interests",
  "customFields",
];

describe("getDefaultSectionOrder", () => {
  it("puts skills first for harvard, keeping the rest in standard order", () => {
    expect(getDefaultSectionOrder("harvard")).toEqual(harvardOrder);
  });

  it("uses the standard order for every other template", () => {
    for (const id of ["basic", "modern", "minimal", "elegant", "classic"] as const) {
      expect(getDefaultSectionOrder(id)).toEqual(standardSectionOrder);
    }
  });
});

describe("sectionOrderForTemplate", () => {
  it("switches an untouched standard order to the harvard default", () => {
    expect(sectionOrderForTemplate([...standardSectionOrder], "harvard")).toEqual(harvardOrder);
  });

  it("switches an untouched harvard order back to the standard default", () => {
    expect(sectionOrderForTemplate([...harvardOrder], "basic")).toEqual(standardSectionOrder);
  });

  it("keeps a user-arranged order when switching to harvard", () => {
    const custom: SectionKey[] = [
      "education",
      "workExperience",
      "skills",
      "languages",
      "certifications",
      "interests",
      "customFields",
    ];
    expect(sectionOrderForTemplate(custom, "harvard")).toBe(custom);
  });

  it("keeps an order with a hidden section as user-arranged", () => {
    const withoutInterests = standardSectionOrder.filter((key) => key !== "interests");
    expect(sectionOrderForTemplate(withoutInterests, "harvard")).toBe(withoutInterests);
  });

  it("keeps an untouched order unchanged when re-picking the same template", () => {
    expect(sectionOrderForTemplate([...harvardOrder], "harvard")).toEqual(harvardOrder);
    expect(sectionOrderForTemplate([...standardSectionOrder], "modern")).toEqual(
      standardSectionOrder,
    );
  });
});
