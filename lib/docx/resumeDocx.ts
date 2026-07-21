
import { Document, HeadingLevel, Paragraph, TextRun } from "docx";
import { fieldLabels, type FieldKey } from "@/lib/fields";
import {
  contactFieldKeys,
  dateRange,
  filledCertificationEntries,
  filledEducationEntries,
  filledLanguageEntries,
  filledSimpleEntries,
  filledWorkEntries,
  resolveFieldOrder,
} from "@/lib/resumeContent";
import { sectionLabels, type ResumeData, type SectionKey } from "@/lib/resumeData";

export interface GenerateResumeDocxParams {
  data: ResumeData;
  sectionOrder: SectionKey[];
  visibleFields?: FieldKey[];
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function bodyParagraphs(text: string): Paragraph[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({ text: line, spacing: { after: 80 } }));
}

function metaParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "666666" })],
    spacing: { after: 40 },
  });
}

function boldParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    spacing: { after: 20 },
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function renderSectionParagraphs(key: SectionKey, data: ResumeData): Paragraph[] {
  switch (key) {
    case "workExperience":
      return filledWorkEntries(data).flatMap((entry) => {
        const paragraphs: Paragraph[] = [];
        if (entry.position) paragraphs.push(boldParagraph(entry.position));
        const meta = [dateRange(entry.dateFrom, entry.dateTo), entry.location]
          .filter(Boolean)
          .join("  ·  ");
        if (meta) paragraphs.push(metaParagraph(meta));
        if (entry.jobDescription) paragraphs.push(...bodyParagraphs(entry.jobDescription));
        return paragraphs;
      });

    case "education":
      return filledEducationEntries(data).flatMap((entry) => {
        const paragraphs: Paragraph[] = [];
        if (entry.school) paragraphs.push(boldParagraph(entry.school));
        const meta = [
          entry.subject,
          [dateRange(entry.dateFrom, entry.dateTo), entry.location].filter(Boolean).join("  ·  "),
        ]
          .filter(Boolean)
          .join("  —  ");
        if (meta) paragraphs.push(metaParagraph(meta));
        if (entry.description) paragraphs.push(...bodyParagraphs(entry.description));
        return paragraphs;
      });

    case "skills":
      return filledSimpleEntries(data.skills).map((entry) => bulletParagraph(entry.value));

    case "certifications":
      return filledCertificationEntries(data).flatMap((entry) => {
        const paragraphs: Paragraph[] = [];
        if (entry.name) paragraphs.push(boldParagraph(entry.name));
        const range = dateRange(entry.dateFrom, entry.dateTo);
        if (range) paragraphs.push(metaParagraph(range));
        return paragraphs;
      });

    case "languages":
      return filledLanguageEntries(data).map(
        (entry) => new Paragraph({ text: `${entry.language} — ${entry.level}` }),
      );

    case "interests":
      return filledSimpleEntries(data.interests).map((entry) => bulletParagraph(entry.value));

    default:
      return [];
  }
}

export function generateResumeDocx({
  data,
  sectionOrder,
  visibleFields,
}: GenerateResumeDocxParams): Document {
  const order = resolveFieldOrder(visibleFields);
  const isVisible = (key: FieldKey) => order.includes(key);

  const children: Paragraph[] = [];

  if (isVisible("name") && data.name) {
    children.push(new Paragraph({ text: data.name, heading: HeadingLevel.TITLE }));
  }
  if (isVisible("jobTitle") && data.jobTitle) {
    children.push(metaParagraph(data.jobTitle));
  }

  const contactLine = order
    .filter((key) => contactFieldKeys.includes(key) && Boolean(data[key as keyof ResumeData]))
    .map((key) => `${fieldLabels[key]}: ${data[key as keyof ResumeData]}`)
    .join("   |   ");
  if (contactLine) {
    children.push(new Paragraph({ text: contactLine, spacing: { after: 200 } }));
  }

  if (isVisible("aboutMe") && data.aboutMe) {
    children.push(sectionHeading(fieldLabels.aboutMe));
    children.push(...bodyParagraphs(data.aboutMe));
  }

  for (const key of sectionOrder) {
    const sectionParagraphs = renderSectionParagraphs(key, data);
    if (sectionParagraphs.length === 0) continue;
    children.push(sectionHeading(sectionLabels[key]));
    children.push(...sectionParagraphs);
  }

  return new Document({
    sections: [{ properties: {}, children }],
  });
}
