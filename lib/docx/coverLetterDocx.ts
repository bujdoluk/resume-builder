/**
 * Word (.docx) rendering of a cover letter, used by `DownloadButton`/
 * `EmailButton` as a non-PDF export format. Mirrors
 * `lib/text/coverLetterText.ts`'s section iteration (`sectionOrder` +
 * `isCoverLetterFieldFilled`) so `.txt`/`.docx`/Preview all agree on what's
 * included — this file only owns how that content is laid out as Word
 * paragraphs.
 *
 * Only ever reached via a dynamic `import()` at Download/Email click-time
 * (see `CoverLetterBuilder.tsx`'s `buildCoverLetterDocxBlob`) — statically
 * importing this module (or the `docx` package it wraps) from the builder
 * would pull `docx`'s ~1MB+ into the initial editor bundle.
 */
import { Document, Paragraph, TextRun } from "docx";
import {
  isCoverLetterFieldFilled,
  type CoverLetterFieldKey,
} from "@/lib/coverLetterFields";
import type { CoverLetterData } from "@/lib/coverLetterData";
import type { CoverLetterSectionKey } from "@/lib/coverLetterSections";

export interface GenerateCoverLetterDocxParams {
  data: CoverLetterData;
  sectionOrder: CoverLetterSectionKey[];
  visibleFields?: CoverLetterFieldKey[];
}

function textParagraph(text: string, spacingAfter = 0): Paragraph {
  return new Paragraph({ text, spacing: { after: spacingAfter } });
}

function boldParagraph(text: string, spacingAfter = 0): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    spacing: { after: spacingAfter },
  });
}

// Word paragraphs don't render "\n" as a line break the way a .txt file
// does — the (potentially multi-line) letter body must become one
// Paragraph per line, or it collapses into a single run-on paragraph.
function multilineParagraphs(text: string): Paragraph[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({ text: line, spacing: { after: 80 } }));
}

function renderSectionParagraphs(
  key: CoverLetterSectionKey,
  data: CoverLetterData,
  has: (field: CoverLetterFieldKey) => boolean,
): Paragraph[] {
  switch (key) {
    case "sender": {
      const paragraphs: Paragraph[] = [];
      if (has("senderName")) paragraphs.push(boldParagraph(data.senderName));
      if (has("senderAddress")) paragraphs.push(textParagraph(data.senderAddress));
      const contact = [
        has("senderPhone") ? data.senderPhone : null,
        has("senderEmail") ? data.senderEmail : null,
      ]
        .filter(Boolean)
        .join(" · ");
      if (contact) paragraphs.push(textParagraph(contact));
      return paragraphs;
    }

    case "date":
      return has("date") ? [textParagraph(data.date)] : [];

    case "recipient": {
      const paragraphs: Paragraph[] = [];
      if (has("recipientName")) paragraphs.push(boldParagraph(data.recipientName));
      if (has("recipientCompany")) paragraphs.push(textParagraph(data.recipientCompany));
      const stateZip = [
        has("recipientState") ? data.recipientState : null,
        has("recipientZipCode") ? data.recipientZipCode : null,
      ]
        .filter(Boolean)
        .join(" ");
      if (stateZip) paragraphs.push(textParagraph(stateZip));
      const contact = [
        has("recipientPhone") ? data.recipientPhone : null,
        has("recipientEmail") ? data.recipientEmail : null,
      ]
        .filter(Boolean)
        .join(" · ");
      if (contact) paragraphs.push(textParagraph(contact));
      return paragraphs;
    }

    case "subject":
      return has("subject") ? [boldParagraph(`Subject: ${data.subject}`)] : [];

    case "letter": {
      const paragraphs: Paragraph[] = [];
      if (has("greeting")) paragraphs.push(textParagraph(data.greeting, 160));
      if (has("body")) paragraphs.push(...multilineParagraphs(data.body));
      if (has("closing")) paragraphs.push(textParagraph(data.closing));
      if (has("signature")) paragraphs.push(textParagraph(data.senderName));
      return paragraphs;
    }

    default:
      return [];
  }
}

export function generateCoverLetterDocx({
  data,
  sectionOrder,
  visibleFields,
}: GenerateCoverLetterDocxParams): Document {
  const has = (field: CoverLetterFieldKey) =>
    (!visibleFields || visibleFields.includes(field)) &&
    isCoverLetterFieldFilled(field, data);

  const children: Paragraph[] = [];
  for (const key of sectionOrder) {
    const sectionParagraphs = renderSectionParagraphs(key, data, has);
    if (sectionParagraphs.length === 0) continue;
    if (children.length > 0) children.push(new Paragraph({ text: "" }));
    children.push(...sectionParagraphs);
  }

  return new Document({ sections: [{ properties: {}, children }] });
}
