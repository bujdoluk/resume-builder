/**
 * Plain-text (.txt) rendering of a resume, used by `DownloadButton`/
 * `EmailButton` as the non-PDF export format. Mirrors
 * `components/pdf/BasicPdfTemplate.tsx`'s field/section visibility and
 * non-empty filtering exactly (same `fieldOrder = visibleFields ?? allFields`
 * fallback, same per-entry "is this entry actually filled in" predicates,
 * same hardcoded-English section titles from `sectionLabels`) so the
 * downloaded/emailed text always matches what Preview/the PDF actually show
 * — just without layout, since there's no such thing as layout in a .txt
 * file.
 */
import { allFields, fieldLabels, type FieldKey } from "@/lib/fields";
import {
  sectionLabels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";

export interface GenerateResumeTextParams {
  data: ResumeData;
  sectionOrder: SectionKey[];
  visibleFields?: FieldKey[];
}

const contactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

function dateRange(from: string, to: string): string {
  return [from, to].filter(Boolean).join(" – ");
}

function filledWorkEntries(data: ResumeData): WorkEntry[] {
  return data.workExperience.filter(
    (e) => e.position || e.location || e.jobDescription || e.dateFrom || e.dateTo,
  );
}

function filledEducationEntries(data: ResumeData): EducationEntry[] {
  return data.education.filter(
    (e) => e.school || e.subject || e.location || e.description || e.dateFrom || e.dateTo,
  );
}

function filledSimpleEntries(entries: SimpleEntry[]): SimpleEntry[] {
  return entries.filter((e) => e.value);
}

function filledCertificationEntries(data: ResumeData): CertificationEntry[] {
  return data.certifications.filter((e) => e.name || e.dateFrom || e.dateTo);
}

function filledLanguageEntries(data: ResumeData): LanguageEntry[] {
  return data.languages.filter((e) => e.language);
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
        const lines = [entry.school].filter(Boolean) as string[];
        if (entry.subject) lines.push(entry.subject);
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

    default:
      return [];
  }
}

export function generateResumeText({
  data,
  sectionOrder,
  visibleFields,
}: GenerateResumeTextParams): string {
  const order = visibleFields ?? allFields;
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
    lines.push("", sectionLabels[key].toUpperCase(), ...sectionLines);
  }

  // Trailing blank lines can accumulate from the work/education entry
  // separators above — trim them so the file doesn't end in empty lines.
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  return lines.join("\n");
}
