"use client";

import type { CoverLetterTemplateProps } from "@/components/cover-letter/desktop-templates/CoverLetterBasicTemplate";
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import { getFontSizeStyle } from "@/lib/fontSize";

// Harvard's style is locked: color and font props are intentionally unused
// below — see components/resumes/desktop-templates/HarvardTemplate.tsx for
// the same rule applied to the resume side.
export default function CoverLetterHarvardTemplate({
  data,
  fontSize,
  visibleFields,
}: CoverLetterTemplateProps) {
  const isVisible = (key: CoverLetterFieldKey) =>
    !visibleFields || visibleFields.includes(key);
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
      className="resume-scalable w-[210mm] min-h-[297mm] bg-white p-12 text-black shadow-xl print:shadow-none"
      style={{ fontFamily: '"Times New Roman", Times, serif', ...fontSizeStyle }}
    >
      <div className="flex flex-col gap-1">
        {senderName && <p className="text-lg font-bold">{senderName}</p>}
        {senderAddress && <p className="text-sm">{senderAddress}</p>}
        {(senderPhone || senderEmail) && (
          <p className="text-sm">
            {[senderPhone, senderEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {date && <p className="mt-6 text-sm">{date}</p>}

      <div className="mt-6 flex flex-col gap-1">
        {recipientName && <p className="font-semibold">{recipientName}</p>}
        {recipientCompany && <p className="text-sm">{recipientCompany}</p>}
        {(recipientState || recipientZipCode) && (
          <p className="text-sm">
            {[recipientState, recipientZipCode].filter(Boolean).join(" ")}
          </p>
        )}
        {(recipientPhone || recipientEmail) && (
          <p className="text-sm">
            {[recipientPhone, recipientEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {subject && <p className="mt-6 font-semibold">{subject}</p>}

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

      {data.customFieldValue && (
        <p className="mt-6 text-sm">{data.customFieldValue}</p>
      )}
    </div>
  );
}
