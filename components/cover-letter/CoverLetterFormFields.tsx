"use client";

/**
 * The cover letter's complete visual layout — field/section markup grouped
 * into five sections (sender info, recipient info, date, subject, letter),
 * plus the outer sizing container (paper-width desktop canvas vs. fluid
 * stacked mobile form) and, for the Modern template, the accent-colored
 * sidebar + white main column split (mirroring the resume's Modern
 * `Resume.tsx`/`ModernMobileTemplate.tsx`). This one component owns ALL of
 * that — for every template × both view modes — the same role
 * `components/resumes/Resume.tsx` plays for the resume (build the field/
 * section content once, then branch the surrounding layout by
 * `templateId`), so `CoverLetter.tsx` (desktop) and the
 * `mobile-templates/*.tsx` files are just thin wrappers that pick
 * `mobile`/lock in a `templateId` and forward every other prop through.
 *
 * `fieldOrder`/`onReorderFields` hold ALL 16 fields' order AND visibility in
 * one flat array (a hidden field is simply absent — same convention as the
 * resume's `visibleFields`), even though each section drags independently:
 * dragging within one section reorders only that section's subsequence,
 * then splices the result back into the full array via
 * `replaceSubsequence` so the other sections' relative positions (and any
 * currently-hidden fields elsewhere in the array) are left untouched. A
 * section collapses entirely once all of its own fields are hidden.
 * `sectionOrder`/`onReorderSections` work the same way at the section
 * level. For Modern, `sectionZones`/`onChangeSectionZones` additionally
 * track which of the two zones (sidebar/main) each section currently sits
 * in — mirroring the resume's `modernSectionZones` — and every section is
 * tagged with `anchor` so the Builder's completion-steps panel can scroll
 * to it regardless of which template/zone it's currently in.
 */
import { useTranslation } from "react-i18next";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import {
  SortableBlock,
  SortableGroup,
  SortableZone,
  SortableZones,
} from "@/components/Sortable";
import { getContrastTextColor } from "@/lib/color";
import type { CoverLetterData } from "@/lib/coverLetterData";
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  splitCoverLetterSectionsByZone,
  type CoverLetterSectionKey,
  type CoverLetterSectionZones,
} from "@/lib/coverLetterSections";
import type { CoverLetterTemplateId } from "@/lib/coverLetterTemplates";
import { getFontSizeStyle, type FontSizeKey } from "@/lib/fontSize";
import { fontsByKey, type FontKey } from "@/lib/fonts";
import type { Dispatch, SetStateAction } from "react";

export interface CoverLetterFormFieldsProps {
  data: CoverLetterData;
  onChange: (field: keyof CoverLetterData, value: string) => void;
  fieldOrder: CoverLetterFieldKey[];
  onReorderFields: (order: CoverLetterFieldKey[]) => void;
  sectionOrder: CoverLetterSectionKey[];
  onReorderSections: (order: CoverLetterSectionKey[]) => void;
  color?: string | null;
  font?: FontKey | null;
  fontSize?: FontSizeKey;
  templateId: CoverLetterTemplateId;
  sectionZones?: CoverLetterSectionZones;
  onChangeSectionZones?: Dispatch<SetStateAction<CoverLetterSectionZones>>;
  mobile?: boolean;
}

const senderKeys = coverLetterSectionFieldKeys.sender;
const recipientKeys = coverLetterSectionFieldKeys.recipient;
const letterKeys = coverLetterSectionFieldKeys.letter;

// Splices a reordered subsequence (e.g. just the sender fields after a drag
// within that section, the visible sections after a drag of the sections
// themselves, or the sidebar/main zones after a cross-zone drag) back into
// a full order, replacing each occurrence of a `subsequenceKeys` member in
// place so every other item's position is left untouched.
function replaceSubsequence<T>(
  fullOrder: T[],
  subsequenceKeys: T[],
  newSubsequence: T[],
): T[] {
  let i = 0;
  return fullOrder.map((key) =>
    subsequenceKeys.includes(key) ? newSubsequence[i++] : key,
  );
}

// `isFirst` is passed explicitly based on the section's index in whichever
// list it's currently rendered from (the flat visible order for Basic, or
// its own zone's item list for Modern) rather than relying on a CSS
// `first:` selector — every section lives in its own `SortableBlock`
// wrapper (for the section-level drag), so every header is the first child
// of ITS OWN parent regardless of position, and `first:mt-0` would fire for
// all of them instead of just the topmost one in each list.
function SectionHeader({
  title,
  color,
  isFirst,
}: {
  title: string;
  color?: string | null;
  isFirst?: boolean;
}) {
  return (
    <h2
      className={`mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase ${isFirst ? "mt-0" : "mt-6"}`}
      style={color ? { color } : undefined}
    >
      {title}
    </h2>
  );
}

export default function CoverLetterFormFields({
  data,
  onChange,
  fieldOrder,
  onReorderFields,
  sectionOrder,
  onReorderSections,
  color,
  font,
  fontSize,
  templateId,
  sectionZones,
  onChangeSectionZones,
  mobile,
}: CoverLetterFormFieldsProps) {
  const { t } = useTranslation();

  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize ?? "medium");

  const visibleSenderOrder = fieldOrder.filter((key) => senderKeys.includes(key));
  const visibleRecipientOrder = fieldOrder.filter((key) =>
    recipientKeys.includes(key),
  );
  const visibleLetterOrder = fieldOrder.filter((key) => letterKeys.includes(key));
  const showDate = fieldOrder.includes("date");
  const showSubject = fieldOrder.includes("subject");

  const sectionVisible: Record<CoverLetterSectionKey, boolean> = {
    sender: visibleSenderOrder.length > 0,
    recipient: visibleRecipientOrder.length > 0,
    date: showDate,
    subject: showSubject,
    letter: visibleLetterOrder.length > 0,
  };
  const visibleSectionOrder = sectionOrder.filter((key) => sectionVisible[key]);

  function handleReorderSections(newOrder: CoverLetterSectionKey[]) {
    onReorderSections(replaceSubsequence(sectionOrder, visibleSectionOrder, newOrder));
  }

  const fieldContent: Record<CoverLetterFieldKey, React.ReactNode> = {
    senderName: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.senderName}
          onChange={(e) => onChange("senderName", e.target.value)}
          placeholder={t("coverLetter.senderNamePlaceholder")}
        />
      </fieldset>
    ),
    senderAddress: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.senderAddress}
          onChange={(e) => onChange("senderAddress", e.target.value)}
          placeholder={t("coverLetter.senderAddressPlaceholder")}
        />
      </fieldset>
    ),
    senderEmail: (
      <fieldset className="fieldset">
        <input
          type="email"
          className="input w-full"
          value={data.senderEmail}
          onChange={(e) => onChange("senderEmail", e.target.value)}
          placeholder={t("coverLetter.senderEmailPlaceholder")}
        />
      </fieldset>
    ),
    senderPhone: (
      <fieldset className="fieldset">
        <input
          type="tel"
          className="input w-full"
          value={data.senderPhone}
          onChange={(e) => onChange("senderPhone", e.target.value)}
          placeholder={t("coverLetter.senderPhonePlaceholder")}
        />
      </fieldset>
    ),
    recipientName: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.recipientName}
          onChange={(e) => onChange("recipientName", e.target.value)}
          placeholder={t("coverLetter.recipientNamePlaceholder")}
        />
      </fieldset>
    ),
    recipientCompany: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.recipientCompany}
          onChange={(e) => onChange("recipientCompany", e.target.value)}
          placeholder={t("coverLetter.recipientCompanyPlaceholder")}
        />
      </fieldset>
    ),
    recipientState: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.recipientState}
          onChange={(e) => onChange("recipientState", e.target.value)}
          placeholder={t("coverLetter.recipientStatePlaceholder")}
        />
      </fieldset>
    ),
    recipientZipCode: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.recipientZipCode}
          onChange={(e) => onChange("recipientZipCode", e.target.value)}
          placeholder={t("coverLetter.recipientZipCodePlaceholder")}
        />
      </fieldset>
    ),
    recipientPhone: (
      <fieldset className="fieldset">
        <input
          type="tel"
          className="input w-full"
          value={data.recipientPhone}
          onChange={(e) => onChange("recipientPhone", e.target.value)}
          placeholder={t("coverLetter.recipientPhonePlaceholder")}
        />
      </fieldset>
    ),
    recipientEmail: (
      <fieldset className="fieldset">
        <input
          type="email"
          className="input w-full"
          value={data.recipientEmail}
          onChange={(e) => onChange("recipientEmail", e.target.value)}
          placeholder={t("coverLetter.recipientEmailPlaceholder")}
        />
      </fieldset>
    ),
    date: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.date}
          onChange={(e) => onChange("date", e.target.value)}
          placeholder={t("coverLetter.datePlaceholder")}
        />
      </fieldset>
    ),
    subject: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.subject}
          onChange={(e) => onChange("subject", e.target.value)}
          placeholder={t("coverLetter.subjectPlaceholder")}
        />
      </fieldset>
    ),
    greeting: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.greeting}
          onChange={(e) => onChange("greeting", e.target.value)}
          placeholder={t("coverLetter.greetingPlaceholder")}
        />
      </fieldset>
    ),
    body: (
      <fieldset className="fieldset">
        <AutoResizeTextarea
          className="textarea w-full"
          value={data.body}
          onChange={(e) => onChange("body", e.target.value)}
          placeholder={t("coverLetter.bodyPlaceholder")}
        />
      </fieldset>
    ),
    closing: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.closing}
          onChange={(e) => onChange("closing", e.target.value)}
          placeholder={t("coverLetter.closingPlaceholder")}
        />
      </fieldset>
    ),
    // Reuses senderName (Section 1) rather than a separate data field, so
    // the signature always stays in sync with the sender's own name — this
    // input just gives a second, contextual place to edit it.
    signature: (
      <fieldset className="fieldset">
        <input
          type="text"
          className="input w-full"
          value={data.senderName}
          onChange={(e) => onChange("senderName", e.target.value)}
          placeholder={t("coverLetter.senderNamePlaceholder")}
        />
      </fieldset>
    ),
  };

  const sectionTitleKey: Record<CoverLetterSectionKey, string> = {
    sender: "coverLetter.sectionSender",
    recipient: "coverLetter.sectionRecipient",
    date: "coverLetter.sectionDate",
    subject: "coverLetter.sectionSubject",
    letter: "coverLetter.sectionLetter",
  };

  // Fields only, no header — the header is rendered separately at map time
  // so `isFirst` can reflect the section's actual position in whichever
  // list it's currently being rendered from.
  const sectionFieldsContent: Record<CoverLetterSectionKey, React.ReactNode> = {
    sender: (
      <SortableGroup
        dndId="cover-letter-sender-fields"
        ids={visibleSenderOrder}
        onReorder={(order) =>
          onReorderFields(replaceSubsequence(fieldOrder, senderKeys, order))
        }
      >
        <div className="flex flex-col gap-2">
          {visibleSenderOrder.map((key) => (
            <SortableBlock key={key} id={key}>
              {fieldContent[key]}
            </SortableBlock>
          ))}
        </div>
      </SortableGroup>
    ),
    recipient: (
      <SortableGroup
        dndId="cover-letter-recipient-fields"
        ids={visibleRecipientOrder}
        onReorder={(order) =>
          onReorderFields(replaceSubsequence(fieldOrder, recipientKeys, order))
        }
      >
        <div className="flex flex-col gap-2">
          {visibleRecipientOrder.map((key) => (
            <SortableBlock key={key} id={key}>
              {fieldContent[key]}
            </SortableBlock>
          ))}
        </div>
      </SortableGroup>
    ),
    date: (
      <SortableGroup dndId="cover-letter-date-field" ids={["date"]} onReorder={() => {}}>
        <SortableBlock id="date">{fieldContent.date}</SortableBlock>
      </SortableGroup>
    ),
    subject: (
      <SortableGroup
        dndId="cover-letter-subject-field"
        ids={["subject"]}
        onReorder={() => {}}
      >
        <SortableBlock id="subject">{fieldContent.subject}</SortableBlock>
      </SortableGroup>
    ),
    letter: (
      <SortableGroup
        dndId="cover-letter-letter-fields"
        ids={visibleLetterOrder}
        onReorder={(order) =>
          onReorderFields(replaceSubsequence(fieldOrder, letterKeys, order))
        }
      >
        <div className="flex flex-col gap-2">
          {visibleLetterOrder.map((key) => (
            <SortableBlock key={key} id={key}>
              {fieldContent[key]}
            </SortableBlock>
          ))}
        </div>
      </SortableGroup>
    ),
  };

  if (templateId === "modern") {
    const zones = sectionZones ?? {};
    const { sidebar: sidebarItems, main: mainItems } = splitCoverLetterSectionsByZone(
      visibleSectionOrder,
      zones,
    );

    function handleZonesChange(next: {
      sidebar: CoverLetterSectionKey[];
      main: CoverLetterSectionKey[];
    }) {
      onReorderSections(
        replaceSubsequence(sectionOrder, visibleSectionOrder, [
          ...next.sidebar,
          ...next.main,
        ]),
      );
      // Merge (don't replace) so a section keeps its remembered zone for
      // whenever it's re-enabled via the Navbar's Features control, instead
      // of silently snapping back to "main".
      onChangeSectionZones?.((prev) => ({
        ...prev,
        ...Object.fromEntries(next.sidebar.map((key) => [key, "sidebar" as const])),
        ...Object.fromEntries(next.main.map((key) => [key, "main" as const])),
      }));
    }

    const sidebarStyle = color
      ? ({
          backgroundColor: color,
          color: getContrastTextColor(color),
          "--sidebar-fg": getContrastTextColor(color),
        } as React.CSSProperties)
      : undefined;

    return (
      <SortableZones
        dndId="cover-letter-modern-sections"
        zones={{ sidebar: sidebarItems, main: mainItems }}
        onChange={handleZonesChange}
      >
        <div
          className={
            mobile
              ? "resume-scalable flex flex-col gap-4 bg-white pl-8"
              : "resume-scalable grid w-[280mm] grid-cols-[90mm_1fr] bg-white shadow-xl"
          }
          style={{ fontFamily, ...fontSizeStyle }}
        >
          <div
            className={
              mobile
                ? "modern-sidebar bg-neutral text-neutral-content flex flex-col gap-2 rounded-lg p-4"
                : "modern-sidebar bg-neutral text-neutral-content flex flex-col p-6 pl-8"
            }
            style={sidebarStyle}
          >
            <SortableZone
              zoneId="sidebar"
              ids={sidebarItems}
              className="flex min-h-8 flex-col"
            >
              {sidebarItems.map((key, index) => (
                <SortableBlock key={key} id={key} anchor>
                  <SectionHeader title={t(sectionTitleKey[key])} isFirst={index === 0} />
                  {sectionFieldsContent[key]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>

          <div className={mobile ? undefined : "p-6 pl-8"}>
            <SortableZone
              zoneId="main"
              ids={mainItems}
              className="flex min-h-8 flex-col"
            >
              {mainItems.map((key, index) => (
                <SortableBlock key={key} id={key} anchor>
                  <SectionHeader
                    title={t(sectionTitleKey[key])}
                    color={color}
                    isFirst={index === 0}
                  />
                  {sectionFieldsContent[key]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>
        </div>
      </SortableZones>
    );
  }

  return (
    <div
      className={
        mobile
          ? "resume-scalable flex flex-col gap-4 bg-white pl-8"
          : "resume-scalable w-[280mm] bg-white p-12 shadow-xl"
      }
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <SortableGroup
        dndId="cover-letter-sections"
        ids={visibleSectionOrder}
        onReorder={handleReorderSections}
      >
        {visibleSectionOrder.map((key, index) => (
          <SortableBlock key={key} id={key} anchor>
            <SectionHeader
              title={t(sectionTitleKey[key])}
              color={color}
              isFirst={index === 0}
            />
            {sectionFieldsContent[key]}
          </SortableBlock>
        ))}
      </SortableGroup>
    </div>
  );
}
