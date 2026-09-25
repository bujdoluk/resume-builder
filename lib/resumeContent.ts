
import { allFields, type FieldKey } from "@/lib/fields";
import type {
  CertificationEntry,
  EducationEntry,
  HonorAwardEntry,
  LanguageEntry,
  ResumeData,
  SimpleEntry,
  WorkEntry,
} from "@/lib/resumeData";

export const contactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

export function resolveFieldOrder(visibleFields?: FieldKey[]): FieldKey[] {
  return visibleFields ?? allFields;
}

export function dateRange(from: string, to: string): string {
  return [from, to].filter(Boolean).join(" – ");
}

export function filledWorkEntries(data: ResumeData): WorkEntry[] {
  return data.workExperience.filter(
    (e) => e.position || e.location || e.jobDescription || e.dateFrom || e.dateTo,
  );
}

export function filledEducationEntries(data: ResumeData): EducationEntry[] {
  return data.education.filter(
    (e) => e.school || e.subject || e.location || e.description || e.dateFrom || e.dateTo,
  );
}

export function filledSimpleEntries(entries: SimpleEntry[]): SimpleEntry[] {
  return entries.filter((e) => e.value);
}

export function filledCertificationEntries(data: ResumeData): CertificationEntry[] {
  return data.certifications.filter((e) => e.name || e.dateFrom || e.dateTo);
}

export function filledLanguageEntries(data: ResumeData): LanguageEntry[] {
  return data.languages.filter((e) => e.language);
}

// Harvard-only bonus sections — see the comment above honorAwardEntrySchema
// in lib/resumeData.ts for why these live outside SECTION_KEYS.
export function filledLeadershipEntries(data: ResumeData): WorkEntry[] {
  return data.leadershipExperience.filter(
    (e) => e.position || e.location || e.jobDescription || e.dateFrom || e.dateTo,
  );
}

export function filledHonorAwardEntries(data: ResumeData): HonorAwardEntry[] {
  return data.honorsAwards.filter((e) => e.name || e.issuer || e.dateFrom || e.dateTo);
}
