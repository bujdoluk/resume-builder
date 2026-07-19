/**
 * Shared "which fields/entries actually have content" resolution for a
 * resume — used by every non-PDF export format (`lib/text/resumeText.ts`,
 * `lib/docx/resumeDocx.ts`) so `.txt` and `.docx` output always agree with
 * each other (and, like both already do, with what Preview/PDF show). The
 * PDF templates keep their own copies of this same filtering inline (see
 * `components/pdf/BasicPdfTemplate.tsx`) since they're tightly coupled to
 * `@react-pdf/renderer` primitives per-template — not worth unifying with
 * those across this refactor.
 */
import { allFields, type FieldKey } from "@/lib/fields";
import type {
  CertificationEntry,
  EducationEntry,
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

// Mirrors `BasicPdfTemplate.tsx`'s `fieldOrder = visibleFields ?? allFields`
// fallback: an unset `visibleFields` means "show everything, in the default
// order"; a set (possibly empty) array is the user's actual chosen order.
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
