
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

export function isCoverLetterFieldFilled(
  key: CoverLetterFieldKey,
  data: CoverLetterData,
): boolean {
  const dataKey = key === "signature" ? "senderName" : key;
  return Boolean(data[dataKey as keyof CoverLetterData]);
}
