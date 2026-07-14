/**
 * Maps each `CoverLetterTemplateId` to its `@react-pdf/renderer` component —
 * the PDF counterpart of `lib/coverLetterTemplates.ts`, used by
 * `CoverLetterBuilder.tsx`'s download handler to pick the right template to
 * render into the generated PDF. Mirrors `lib/pdf/templates.ts`.
 */
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
