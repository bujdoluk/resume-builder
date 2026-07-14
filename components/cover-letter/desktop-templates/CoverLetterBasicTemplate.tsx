"use client";

/**
 * Read-only Basic cover letter template: a plain single-column business
 * letter layout (sender info, date, recipient info, subject, greeting,
 * body, closing) — used for the Preview modal and the always-mounted
 * print-only copy. Supports the same color/font/font-size/field-visibility
 * customization as the resume templates (see `TemplateProps` in
 * `components/resumes/desktop-templates/BasicTemplate.tsx`), applied here via
 * `accentColor` (subject line) and the shared `.resume-scalable` font-size
 * scaling mechanism.
 */
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import type { CoverLetterData } from "@/lib/coverLetterData";
import type {
  CoverLetterSectionKey,
  CoverLetterSectionZones,
} from "@/lib/coverLetterSections";
import { getFontSizeStyle, type FontSizeKey } from "@/lib/fontSize";
import { fontsByKey, type FontKey } from "@/lib/fonts";

// `sectionOrder`/`sectionZones` are only meaningful for the Modern template
// (which sections sit in its sidebar vs. main column) — Basic ignores
// them, same as it already ignores parts of `color`.
export interface CoverLetterTemplateProps {
  data: CoverLetterData;
  color?: string | null;
  font?: FontKey | null;
  fontSize?: FontSizeKey;
  visibleFields?: CoverLetterFieldKey[];
  sectionOrder?: CoverLetterSectionKey[];
  sectionZones?: CoverLetterSectionZones;
}

export default function CoverLetterBasicTemplate({
  data,
  color,
  font,
  fontSize,
  visibleFields,
}: CoverLetterTemplateProps) {
  const isVisible = (key: CoverLetterFieldKey) =>
    !visibleFields || visibleFields.includes(key);
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize ?? "medium");

  const senderName = isVisible("senderName") && data.senderName;
  const senderAddress = isVisible("senderAddress") && data.senderAddress;
  const senderPhone = isVisible("senderPhone") && data.senderPhone;
  const senderEmail = isVisible("senderEmail") && data.senderEmail;
  const date = isVisible("date") && data.date;
  const recipientName = isVisible("recipientName") && data.recipientName;
  const recipientCompany =
    isVisible("recipientCompany") && data.recipientCompany;
  const recipientState = isVisible("recipientState") && data.recipientState;
  const recipientZipCode =
    isVisible("recipientZipCode") && data.recipientZipCode;
  const recipientPhone = isVisible("recipientPhone") && data.recipientPhone;
  const recipientEmail = isVisible("recipientEmail") && data.recipientEmail;
  const subject = isVisible("subject") && data.subject;
  const greeting = isVisible("greeting") && data.greeting;
  const body = isVisible("body") && data.body;
  const closing = isVisible("closing") && data.closing;
  const signature = isVisible("signature") && data.senderName;

  return (
    <div
      className="resume-scalable w-[210mm] min-h-[297mm] bg-white p-12 shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div className="flex flex-col gap-1">
        {senderName && <p className="text-lg font-bold">{senderName}</p>}
        {senderAddress && (
          <p className="text-sm text-gray-600">{senderAddress}</p>
        )}
        {(senderPhone || senderEmail) && (
          <p className="text-sm text-gray-600">
            {[senderPhone, senderEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {date && <p className="mt-6 text-sm text-gray-600">{date}</p>}

      <div className="mt-6 flex flex-col gap-1">
        {recipientName && <p className="font-semibold">{recipientName}</p>}
        {recipientCompany && (
          <p className="text-sm text-gray-600">{recipientCompany}</p>
        )}
        {(recipientState || recipientZipCode) && (
          <p className="text-sm text-gray-600">
            {[recipientState, recipientZipCode].filter(Boolean).join(" ")}
          </p>
        )}
        {(recipientPhone || recipientEmail) && (
          <p className="text-sm text-gray-600">
            {[recipientPhone, recipientEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {subject && (
        <p className="mt-6 font-semibold" style={color ? { color } : undefined}>
          {subject}
        </p>
      )}

      {greeting && <p className="mt-6">{greeting}</p>}

      {body && (
        <p className="mt-4 leading-relaxed whitespace-pre-line">{body}</p>
      )}

      {(closing || signature) && (
        <div className="mt-6 flex flex-col gap-1">
          {closing && <p>{closing}</p>}
          {signature && <p>{signature}</p>}
        </div>
      )}
    </div>
  );
}
