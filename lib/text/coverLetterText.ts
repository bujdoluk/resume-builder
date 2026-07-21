
import {
  isCoverLetterFieldFilled,
  type CoverLetterFieldKey,
} from "@/lib/coverLetterFields";
import type { CoverLetterData } from "@/lib/coverLetterData";
import type { CoverLetterSectionKey } from "@/lib/coverLetterSections";

export interface GenerateCoverLetterTextParams {
  data: CoverLetterData;
  sectionOrder: CoverLetterSectionKey[];
  visibleFields?: CoverLetterFieldKey[];
}

function renderSectionLines(
  key: CoverLetterSectionKey,
  data: CoverLetterData,
  has: (field: CoverLetterFieldKey) => boolean,
): string[] {
  switch (key) {
    case "sender": {
      const lines: string[] = [];
      if (has("senderName")) lines.push(data.senderName);
      if (has("senderAddress")) lines.push(data.senderAddress);
      const contact = [
        has("senderPhone") ? data.senderPhone : null,
        has("senderEmail") ? data.senderEmail : null,
      ]
        .filter(Boolean)
        .join(" · ");
      if (contact) lines.push(contact);
      return lines;
    }

    case "date":
      return has("date") ? [data.date] : [];

    case "recipient": {
      const lines: string[] = [];
      if (has("recipientName")) lines.push(data.recipientName);
      if (has("recipientCompany")) lines.push(data.recipientCompany);
      const stateZip = [
        has("recipientState") ? data.recipientState : null,
        has("recipientZipCode") ? data.recipientZipCode : null,
      ]
        .filter(Boolean)
        .join(" ");
      if (stateZip) lines.push(stateZip);
      const contact = [
        has("recipientPhone") ? data.recipientPhone : null,
        has("recipientEmail") ? data.recipientEmail : null,
      ]
        .filter(Boolean)
        .join(" · ");
      if (contact) lines.push(contact);
      return lines;
    }

    case "subject":
      return has("subject") ? [`Subject: ${data.subject}`] : [];

    case "letter": {
      const lines: string[] = [];
      if (has("greeting")) lines.push(data.greeting, "");
      if (has("body")) lines.push(data.body, "");
      if (has("closing")) lines.push(data.closing);
      if (has("signature")) lines.push(data.senderName);
      while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
      return lines;
    }

    default:
      return [];
  }
}

export function generateCoverLetterText({
  data,
  sectionOrder,
  visibleFields,
}: GenerateCoverLetterTextParams): string {
  const has = (field: CoverLetterFieldKey) =>
    (!visibleFields || visibleFields.includes(field)) &&
    isCoverLetterFieldFilled(field, data);

  const lines: string[] = [];
  for (const key of sectionOrder) {
    const sectionLines = renderSectionLines(key, data, has);
    if (sectionLines.length === 0) continue;
    if (lines.length > 0) lines.push("");
    lines.push(...sectionLines);
  }

  return lines.join("\n");
}
