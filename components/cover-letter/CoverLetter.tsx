"use client";

import CoverLetterFormFields, {
  type CoverLetterFormFieldsProps,
} from "@/components/cover-letter/CoverLetterFormFields";

export type CoverLetterProps = Omit<CoverLetterFormFieldsProps, "mobile">;

export default function CoverLetter(props: CoverLetterProps) {
  return <CoverLetterFormFields {...props} mobile={false} />;
}
