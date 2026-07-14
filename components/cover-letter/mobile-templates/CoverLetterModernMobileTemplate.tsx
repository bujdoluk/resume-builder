"use client";

/**
 * Mobile-width editing form for the Modern cover letter template — a thin
 * wrapper that locks `CoverLetterFormFields` (which owns the actual layout
 * for every template × both view modes) to `templateId="modern"` and its
 * fluid, stacked mobile container (colored sidebar block stacked above the
 * white main block, rather than side-by-side). Mirrors the resume side's
 * `ModernMobileTemplate.tsx`.
 */
import CoverLetterFormFields from "@/components/cover-letter/CoverLetterFormFields";
import type { CoverLetterMobileTemplateProps } from "@/components/cover-letter/mobile-templates/CoverLetterBasicMobileTemplate";

export default function CoverLetterModernMobileTemplate(
  props: CoverLetterMobileTemplateProps,
) {
  return <CoverLetterFormFields {...props} templateId="modern" mobile />;
}
