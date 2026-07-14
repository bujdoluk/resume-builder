/**
 * The cover letter's fixed section groupings (sender info, recipient info,
 * date, subject, letter) — shared between the editable form
 * (`CoverLetterEditor.tsx`, which lets the user drag-reorder the sections
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
