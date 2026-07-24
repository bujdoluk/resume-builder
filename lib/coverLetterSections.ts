
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";

export type CoverLetterSectionKey =
  | "sender"
  | "date"
  | "recipient"
  | "subject"
  | "letter"
  | "customFields";

export const defaultCoverLetterSectionOrder: CoverLetterSectionKey[] = [
  "sender",
  "date",
  "recipient",
  "subject",
  "letter",
  "customFields",
];

export const coverLetterSectionStepTitleKey: Record<CoverLetterSectionKey, string> = {
  sender: "coverLetter.sectionSender",
  recipient: "coverLetter.sectionRecipient",
  date: "coverLetter.sectionDate",
  subject: "coverLetter.sectionSubject",
  letter: "coverLetter.sectionLetter",
  customFields: "coverLetter.sectionCustomFields",
};

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
  customFields: [],
};

export type CoverLetterSectionZone = "sidebar" | "main";
export type CoverLetterSectionZones = Partial<
  Record<CoverLetterSectionKey, CoverLetterSectionZone>
>;

export const defaultCoverLetterSectionZones: Record<
  CoverLetterSectionKey,
  CoverLetterSectionZone
> = {
  sender: "sidebar",
  date: "main",
  recipient: "main",
  subject: "main",
  letter: "main",
  customFields: "main",
};

export function resolveCoverLetterSectionZone(
  key: CoverLetterSectionKey,
  zones: CoverLetterSectionZones,
): CoverLetterSectionZone {
  return zones[key] ?? defaultCoverLetterSectionZones[key];
}

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
