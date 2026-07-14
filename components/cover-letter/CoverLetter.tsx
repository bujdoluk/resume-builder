"use client";

/**
 * Desktop editing canvas for the cover letter builder (mirrors the
 * resume's `Resume.tsx`) — a thin wrapper that locks `CoverLetterFormFields`
 * (which owns the actual layout for every template × both view modes) to
 * its desktop ("paper") container. The mobile counterparts,
 * `mobile-templates/CoverLetterBasicMobileTemplate.tsx` and
 * `CoverLetterModernMobileTemplate.tsx`, are the equivalent thin wrappers
 * for the fluid, stacked mobile form.
 */
import CoverLetterFormFields, {
  type CoverLetterFormFieldsProps,
} from "@/components/cover-letter/CoverLetterFormFields";

export type CoverLetterProps = Omit<CoverLetterFormFieldsProps, "mobile">;

export default function CoverLetter(props: CoverLetterProps) {
  return <CoverLetterFormFields {...props} mobile={false} />;
}
