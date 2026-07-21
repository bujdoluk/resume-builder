
import type { ComponentType } from "react";
import BasicPdfTemplate, {
  type PdfTemplateProps,
} from "@/components/pdf/BasicPdfTemplate";
import ClassicPdfTemplate from "@/components/pdf/ClassicPdfTemplate";
import ElegantPdfTemplate from "@/components/pdf/ElegantPdfTemplate";
import MinimalPdfTemplate from "@/components/pdf/MinimalPdfTemplate";
import ModernPdfTemplate from "@/components/pdf/ModernPdfTemplate";
import type { TemplateId } from "@/lib/templates";

export type { PdfTemplateProps };

export const pdfTemplates: Record<TemplateId, ComponentType<PdfTemplateProps>> = {
  basic: BasicPdfTemplate,
  modern: ModernPdfTemplate,
  minimal: MinimalPdfTemplate,
  elegant: ElegantPdfTemplate,
  classic: ClassicPdfTemplate,
};
