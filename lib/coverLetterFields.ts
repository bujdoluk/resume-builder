/**
 * The set of cover letter fields the Navbar's "Features" control can
 * show/hide — mirrors `lib/fields.ts`'s resume field list. "signature"
 * reuses the `senderName` data value (see `CoverLetterEditor.tsx`) but gets
 * its own visibility toggle since it's a distinct spot in the letter
 * (the closing block) from the sender-info block's name field.
 */
import type { CoverLetterData } from "@/lib/coverLetterData";

export type CoverLetterFieldKey =
  | "senderName"
  | "senderAddress"
  | "senderEmail"
  | "senderPhone"
  | "date"
  | "recipientName"
  | "recipientCompany"
  | "recipientState"
  | "recipientZipCode"
  | "recipientPhone"
  | "recipientEmail"
  | "subject"
  | "greeting"
  | "body"
  | "closing"
  | "signature";

export const allCoverLetterFields: CoverLetterFieldKey[] = [
  "senderName",
  "senderAddress",
  "senderEmail",
  "senderPhone",
  "date",
  "recipientName",
  "recipientCompany",
  "recipientState",
  "recipientZipCode",
  "recipientPhone",
  "recipientEmail",
  "subject",
  "greeting",
  "body",
  "closing",
  "signature",
];

// "signature" reuses `senderName`'s value (see `CoverLetterEditor.tsx`), so
// it's graded against that same underlying field rather than a nonexistent
// `data.signature` — used by the Cover Letter Builder's completion steps
// panel to grade only the currently-visible fields.
export function isCoverLetterFieldFilled(
  key: CoverLetterFieldKey,
  data: CoverLetterData,
): boolean {
  const dataKey = key === "signature" ? "senderName" : key;
  return Boolean(data[dataKey as keyof CoverLetterData]);
}
