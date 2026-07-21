"use client";

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
