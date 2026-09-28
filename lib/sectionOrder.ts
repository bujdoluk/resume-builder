import type { SectionKey } from "@/lib/resumeData";
import type { TemplateId } from "@/lib/templates";

export const standardSectionOrder: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "languages",
  "certifications",
  "interests",
  "customFields",
];

const harvardSectionOrder: SectionKey[] = [
  "skills",
  ...standardSectionOrder.filter((key) => key !== "skills"),
];

const templateSectionOrders: Partial<Record<TemplateId, SectionKey[]>> = {
  harvard: harvardSectionOrder,
};

export function getDefaultSectionOrder(templateId: TemplateId): SectionKey[] {
  return templateSectionOrders[templateId] ?? standardSectionOrder;
}

function sameOrder(a: SectionKey[], b: SectionKey[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

// An order still equal to some template's default counts as untouched, so it follows the
// newly picked template's default; anything the user arranged themselves is kept as-is.
export function sectionOrderForTemplate(
  current: SectionKey[],
  templateId: TemplateId,
): SectionKey[] {
  const isUntouched = [standardSectionOrder, ...Object.values(templateSectionOrders)].some(
    (order) => order !== undefined && sameOrder(current, order),
  );
  return isUntouched ? getDefaultSectionOrder(templateId) : current;
}
