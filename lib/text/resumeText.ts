
import { fieldLabels, type FieldKey } from "@/lib/fields";
import {
  contactFieldKeys,
  dateRange,
  filledCertificationEntries,
  filledEducationEntries,
  filledLanguageEntries,
  filledSimpleEntries,
  filledWorkEntries,
  resolveFieldOrder,
} from "@/lib/resumeContent";
import { sectionLabels, type ResumeData, type SectionKey } from "@/lib/resumeData";

export interface GenerateResumeTextParams {
  data: ResumeData;
  sectionOrder: SectionKey[];
  visibleFields?: FieldKey[];
}

function renderSectionLines(key: SectionKey, data: ResumeData): string[] {
  switch (key) {
    case "workExperience":
      return filledWorkEntries(data).flatMap((entry) => {
        const lines = [entry.position].filter(Boolean) as string[];
        const range = dateRange(entry.dateFrom, entry.dateTo);
        if (range) lines.push(range);
        if (entry.location) lines.push(entry.location);
        if (entry.jobDescription) lines.push(entry.jobDescription);
        return [...lines, ""];
      });

    case "education":
      return filledEducationEntries(data).flatMap((entry) => {
        const lines = [entry.subject].filter(Boolean) as string[];
        if (entry.school) lines.push(entry.school);
        if (entry.location) lines.push(entry.location);
        const range = dateRange(entry.dateFrom, entry.dateTo);
        if (range) lines.push(range);
        if (entry.description) lines.push(entry.description);
        return [...lines, ""];
      });

    case "skills":
      return filledSimpleEntries(data.skills).map((e) => e.value);

    case "certifications":
      return filledCertificationEntries(data).map((entry) => {
        const range = dateRange(entry.dateFrom, entry.dateTo);
        return range ? `${entry.name} (${range})` : entry.name;
      });

    case "languages":
      return filledLanguageEntries(data).map((entry) => `${entry.language} — ${entry.level}`);

    case "interests":
      return [filledSimpleEntries(data.interests).map((e) => e.value).join(", ")].filter(
        Boolean,
      );

    case "customFields":
      return data.customFieldValue ? [data.customFieldValue] : [];

    default:
      return [];
  }
}

export function generateResumeText({
  data,
  sectionOrder,
  visibleFields,
}: GenerateResumeTextParams): string {
  const order = resolveFieldOrder(visibleFields);
  const isVisible = (key: FieldKey) => order.includes(key);

  const lines: string[] = [];

  if (isVisible("name") && data.name) lines.push(data.name);
  if (isVisible("jobTitle") && data.jobTitle) lines.push(data.jobTitle);

  const contactLine = order
    .filter((key) => contactFieldKeys.includes(key) && Boolean(data[key as keyof ResumeData]))
    .map((key) => `${fieldLabels[key]}: ${data[key as keyof ResumeData]}`)
    .join("  |  ");
  if (contactLine) lines.push(contactLine);

  if (isVisible("aboutMe") && data.aboutMe) {
    lines.push("", fieldLabels.aboutMe.toUpperCase(), data.aboutMe);
  }

  for (const key of sectionOrder) {
    const sectionLines = renderSectionLines(key, data);
    if (sectionLines.length === 0) continue;
    const heading = key === "customFields" ? data.customFieldsTitle || sectionLabels[key] : sectionLabels[key];
    lines.push("", heading.toUpperCase(), ...sectionLines);
  }

  // Trailing blank lines can accumulate from the work/education entry
  // separators above — trim them so the file doesn't end in empty lines.
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  return lines.join("\n");
}
