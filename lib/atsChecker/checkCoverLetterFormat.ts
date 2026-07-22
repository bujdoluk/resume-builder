import type { CoverLetterData } from "@/lib/coverLetterData";
import type { CoverLetterTemplateId } from "@/lib/coverLetterTemplates";
import type { FormatCheckItem } from "@/lib/atsChecker/types";
import { MIN_COVER_LETTER_BODY_LENGTH } from "@/lib/constants";

const MULTI_COLUMN_TEMPLATES: CoverLetterTemplateId[] = ["modern"];
const QUANTIFIED_PATTERN = /\d|%/;

export function checkCoverLetterFormat(
  data: CoverLetterData,
  templateId: CoverLetterTemplateId,
): FormatCheckItem[] {
  return [
    {
      id: "singleColumnTemplate",
      passed: !MULTI_COLUMN_TEMPLATES.includes(templateId),
      labelKey: "atsChecker.checks.multiColumnTemplate",
    },
    {
      id: "hasSenderContact",
      passed: Boolean(data.senderEmail.trim() && data.senderPhone.trim()),
      labelKey: "atsChecker.checks.hasSenderContact",
    },
    {
      id: "hasRecipientInfo",
      passed: Boolean(data.recipientName.trim() || data.recipientCompany.trim()),
      labelKey: "atsChecker.checks.hasRecipientInfo",
    },
    {
      id: "hasSubject",
      passed: Boolean(data.subject.trim()),
      labelKey: "atsChecker.checks.hasSubject",
    },
    {
      id: "bodyLongEnough",
      passed: data.body.trim().length >= MIN_COVER_LETTER_BODY_LENGTH,
      labelKey: "atsChecker.checks.bodyLongEnough",
    },
    {
      id: "hasQuantifiedContent",
      passed: QUANTIFIED_PATTERN.test(data.body),
      labelKey: "atsChecker.checks.hasQuantifiedContent",
    },
  ];
}
