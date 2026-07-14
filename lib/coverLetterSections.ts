/**
 * The cover letter's fixed section groupings (sender info, recipient info,
 * date, subject, letter) — shared between the editable form
 * (`CoverLetter.tsx`, which lets the user drag-reorder the sections
 * and needs to know which fields belong to each) and the Cover Letter
 * Builder's completion-steps panel (`CoverLetterBuilder.tsx`, which needs
 * the same section → field-key groupings to compute per-section
 * completion, mirroring the resume editor's `resumeSteps`).
 */
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";

export type CoverLetterSectionKey =
  | "sender"
  | "date"
  | "recipient"
  | "subject"
  | "letter";

export const defaultCoverLetterSectionOrder: CoverLetterSectionKey[] = [
  "sender",
  "date",
  "recipient",
  "subject",
  "letter",
];

export const coverLetterSectionFieldKeys: Record<
  CoverLetterSectionKey,
  CoverLetterFieldKey[]
> = {
  sender: ["senderName", "senderAddress", "senderEmail", "senderPhone"],
  date: ["date"],
  recipient: [
    "recipientName",
    "recipientCompany",
    "recipientState",
    "recipientZipCode",
    "recipientPhone",
    "recipientEmail",
  ],
  subject: ["subject"],
  letter: ["greeting", "body", "closing", "signature"],
};

// Which of the Modern template's two visual zones (accent-colored sidebar
// vs. plain main column) a section renders in — mirrors the resume's
// `ModernSectionZones` (see `lib/resumeData.ts`), stored per-cover-letter
// rather than fixed, since it's user-reassignable by dragging. Basic
// ignores this entirely (single flat column, no zones).
export type CoverLetterSectionZone = "sidebar" | "main";
export type CoverLetterSectionZones = Partial<
  Record<CoverLetterSectionKey, CoverLetterSectionZone>
>;

// Sender info defaults to the sidebar (contact details read naturally in a
// letterhead-style column) — every other section defaults to main, since a
// multi-paragraph letter body reads poorly squeezed into a narrow sidebar.
export const defaultCoverLetterSectionZones: Record<
  CoverLetterSectionKey,
  CoverLetterSectionZone
> = {
  sender: "sidebar",
  date: "main",
  recipient: "main",
  subject: "main",
  letter: "main",
};

export function resolveCoverLetterSectionZone(
  key: CoverLetterSectionKey,
  zones: CoverLetterSectionZones,
): CoverLetterSectionZone {
  return zones[key] ?? defaultCoverLetterSectionZones[key];
}

// Splits an ordered section list into the two zones, preserving each zone's
// relative order — mirrors the resume's `splitSectionsByZone`.
export function splitCoverLetterSectionsByZone(
  order: CoverLetterSectionKey[],
  zones: CoverLetterSectionZones,
): { sidebar: CoverLetterSectionKey[]; main: CoverLetterSectionKey[] } {
  const sidebar: CoverLetterSectionKey[] = [];
  const main: CoverLetterSectionKey[] = [];
  for (const key of order) {
    if (resolveCoverLetterSectionZone(key, zones) === "sidebar") {
      sidebar.push(key);
    } else {
      main.push(key);
    }
  }
  return { sidebar, main };
}
