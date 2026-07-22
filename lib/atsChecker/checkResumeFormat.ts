import type { ResumeData } from "@/lib/resumeData";
import type { FormatCheckItem } from "@/lib/atsChecker/types";
import type { TemplateId } from "@/lib/templates";

const MULTI_COLUMN_TEMPLATES: TemplateId[] = ["modern", "elegant"];
const QUANTIFIED_PATTERN = /\d|%/;

export function checkResumeFormat(data: ResumeData, templateId: TemplateId): FormatCheckItem[] {
  const filledWork = data.workExperience.filter((entry) => entry.position.trim());
  const filledSkills = data.skills.filter((entry) => entry.value.trim());
  const filledCertifications = data.certifications.filter((entry) => entry.name.trim());
  const filledLanguages = data.languages.filter((entry) => entry.language.trim());

  return [
    {
      id: "singleColumnTemplate",
      passed: !MULTI_COLUMN_TEMPLATES.includes(templateId),
      labelKey: "atsChecker.checks.multiColumnTemplate",
    },
    {
      id: "hasName",
      passed: Boolean(data.name.trim()),
      labelKey: "atsChecker.checks.hasName",
    },
    {
      id: "hasEmail",
      passed: Boolean(data.email.trim()),
      labelKey: "atsChecker.checks.hasEmail",
    },
    {
      id: "hasPhone",
      passed: Boolean(data.phone.trim()),
      labelKey: "atsChecker.checks.hasPhone",
    },
    {
      id: "hasWorkExperience",
      passed: filledWork.length > 0,
      labelKey: "atsChecker.checks.hasWorkExperience",
    },
    {
      id: "workDatesComplete",
      passed: filledWork.length === 0 || filledWork.every((entry) => entry.dateFrom.trim() && entry.dateTo.trim()),
      labelKey: "atsChecker.checks.workDatesComplete",
    },
    {
      id: "hasSkills",
      passed: filledSkills.length > 0,
      labelKey: "atsChecker.checks.hasSkills",
    },
    {
      id: "hasQuantifiedAchievements",
      passed: filledWork.some((entry) => QUANTIFIED_PATTERN.test(entry.jobDescription)),
      labelKey: "atsChecker.checks.hasQuantifiedContent",
    },
    {
      id: "hasSummary",
      passed: Boolean(data.aboutMe.trim()),
      labelKey: "atsChecker.checks.hasSummary",
    },
    {
      id: "hasCertifications",
      passed: filledCertifications.length > 0,
      labelKey: "atsChecker.checks.hasCertifications",
    },
    {
      id: "hasLanguages",
      passed: filledLanguages.length > 0,
      labelKey: "atsChecker.checks.hasLanguages",
    },
  ];
}
