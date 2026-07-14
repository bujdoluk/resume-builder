"use client";

/**
 * Mobile-width editing form for the Basic cover letter template — a thin
 * wrapper that locks `CoverLetterFormFields` (which owns the actual layout
 * for every template × both view modes) to `templateId="basic"` and its
 * fluid, stacked mobile container. Mirrors the resume side's
 * `BasicMobileTemplate.tsx`.
 *
 * `CoverLetterMobileTemplateProps` (declared here, mirroring how the
 * resume's `MobileTemplateProps` lives in `BasicMobileTemplate.tsx` and is
 * imported by every other mobile template) is the canonical prop shape
 * every cover letter mobile template must accept, including
 * `sectionZones`/`onChangeSectionZones` — Basic ignores them, but Modern
 * needs them, and the registry (`lib/coverLetterTemplates.ts`) types
 * `mobileTemplateComponent` against this one shared interface so
 * `CoverLetterBuilder.tsx` can render whichever template is active without
 * knowing which one ahead of time.
 */
import CoverLetterFormFields, {
  type CoverLetterFormFieldsProps,
} from "@/components/cover-letter/CoverLetterFormFields";

export type CoverLetterMobileTemplateProps = Omit<
  CoverLetterFormFieldsProps,
  "templateId" | "mobile"
>;

export default function CoverLetterBasicMobileTemplate(
  props: CoverLetterMobileTemplateProps,
) {
  return <CoverLetterFormFields {...props} templateId="basic" mobile />;
}
