"use client";

import CoverLetterFormFields from "@/components/cover-letter/CoverLetterFormFields";
import type { CoverLetterMobileTemplateProps } from "@/components/cover-letter/mobile-templates/CoverLetterBasicMobileTemplate";

export default function CoverLetterModernMobileTemplate(
  props: CoverLetterMobileTemplateProps,
) {
  return <CoverLetterFormFields {...props} templateId="modern" mobile />;
}
