/**
 * Maps each `TemplateId` to its `@react-pdf/renderer` component — the PDF
 * counterpart of `lib/templates.ts`, used by `Home.tsx`'s download handler
 * to pick the right template to render into the generated PDF.
 */
import type { ComponentType } from "react";
import BasicPdfTemplate, {
  type PdfTemplateProps,
} from "@/components/pdf/BasicPdfTemplate";
import MinimalPdfTemplate from "@/components/pdf/MinimalPdfTemplate";
import ModernPdfTemplate from "@/components/pdf/ModernPdfTemplate";
import type { TemplateId } from "@/lib/templates";

export type { PdfTemplateProps };

export const pdfTemplates: Record<TemplateId, ComponentType<PdfTemplateProps>> = {
  basic: BasicPdfTemplate,
  modern: ModernPdfTemplate,
  minimal: MinimalPdfTemplate,
};
