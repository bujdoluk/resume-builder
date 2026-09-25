"use client";

import CoverLetterFormFields, {
  type CoverLetterFormFieldsProps,
} from "@/components/cover-letter/CoverLetterFormFields";

export type CoverLetterMobileTemplateProps = Omit<
  CoverLetterFormFieldsProps,
  "templateId" | "mobile"
>;

export default function CoverLetterHarvardMobileTemplate(
  props: CoverLetterMobileTemplateProps,
) {
  return <CoverLetterFormFields {...props} templateId="harvard" mobile />;
}
