"use client";

import { Fragment } from "react";
import type { CoverLetterTemplateProps } from "@/components/cover-letter/desktop-templates/CoverLetterBasicTemplate";
import { getContrastTextColor } from "@/lib/color";
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import {
  defaultCoverLetterSectionOrder,
  splitCoverLetterSectionsByZone,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { getFontSizeStyle } from "@/lib/fontSize";
import { fontsByKey } from "@/lib/fonts";

export default function CoverLetterModernTemplate({
  data,
  color,
  font,
  fontSize,
  visibleFields,
  sectionOrder,
  sectionZones,
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

  const sectionContent: Partial<Record<CoverLetterSectionKey, React.ReactNode>> = {
    sender: (senderName || senderAddress || senderPhone || senderEmail) && (
      <div className="flex flex-col gap-1">
        {senderName && <p className="text-lg font-bold">{senderName}</p>}
        {senderAddress && <p className="text-sm opacity-70">{senderAddress}</p>}
        {(senderPhone || senderEmail) && (
          <p className="text-sm opacity-70">
            {[senderPhone, senderEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    ),

    date: date && <p className="text-sm opacity-70">{date}</p>,

    recipient: (recipientName ||
      recipientCompany ||
      recipientState ||
      recipientZipCode ||
      recipientPhone ||
      recipientEmail) && (
      <div className="flex flex-col gap-1">
        {recipientName && <p className="font-semibold">{recipientName}</p>}
        {recipientCompany && (
          <p className="text-sm opacity-70">{recipientCompany}</p>
        )}
        {(recipientState || recipientZipCode) && (
          <p className="text-sm opacity-70">
            {[recipientState, recipientZipCode].filter(Boolean).join(" ")}
          </p>
        )}
        {(recipientPhone || recipientEmail) && (
          <p className="text-sm opacity-70">
            {[recipientPhone, recipientEmail].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    ),

    subject: subject && (
      <p className="font-semibold" style={color ? { color } : undefined}>
        {subject}
      </p>
    ),

    letter: (greeting || body || closing || signature) && (
      <div className="flex flex-col gap-4">
        {greeting && <p>{greeting}</p>}
        {body && <p className="leading-relaxed whitespace-pre-line">{body}</p>}
        {(closing || signature) && (
          <div className="flex flex-col gap-1">
            {closing && <p>{closing}</p>}
            {signature && <p>{signature}</p>}
          </div>
        )}
      </div>
    ),

    customFields: Boolean(data.customFieldValue) && (
      <p className="text-sm opacity-70">{data.customFieldValue}</p>
    ),
  };

  const order = sectionOrder ?? defaultCoverLetterSectionOrder;
  const { sidebar, main } = splitCoverLetterSectionsByZone(
    order,
    sectionZones ?? {},
  );

  const sidebarStyle = color
    ? ({
        backgroundColor: color,
        color: getContrastTextColor(color),
        "--sidebar-fg": getContrastTextColor(color),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="resume-scalable grid w-[210mm] min-h-[297mm] grid-cols-[70mm_1fr] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div
        className="modern-sidebar bg-neutral text-neutral-content flex flex-col gap-6 p-6"
        style={sidebarStyle}
      >
        {sidebar.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>

      <div className="flex flex-col gap-6 p-6">
        {main.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
