
import type { ComponentType } from "react";
import CoverLetterModernPdfTemplate from "@/components/pdf/CoverLetterModernPdfTemplate";
import CoverLetterPdfTemplate, {
  type CoverLetterPdfTemplateProps,
} from "@/components/pdf/CoverLetterPdfTemplate";
import type { CoverLetterTemplateId } from "@/lib/coverLetterTemplates";

export type { CoverLetterPdfTemplateProps };

export const coverLetterPdfTemplates: Record<
  CoverLetterTemplateId,
  ComponentType<CoverLetterPdfTemplateProps>
> = {
  basic: CoverLetterPdfTemplate,
  modern: CoverLetterModernPdfTemplate,
};
