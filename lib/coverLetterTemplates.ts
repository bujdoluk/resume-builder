
import { findOrFirst } from "@/lib/arrayUtils";
import type { TemplateDefinition } from "@/lib/templateDefinition";
import CoverLetterBasicMobileTemplate, {
  type CoverLetterMobileTemplateProps,
} from "@/components/cover-letter/mobile-templates/CoverLetterBasicMobileTemplate";
import CoverLetterModernMobileTemplate from "@/components/cover-letter/mobile-templates/CoverLetterModernMobileTemplate";
import CoverLetterBasicTemplate, {
  type CoverLetterTemplateProps,
} from "@/components/cover-letter/desktop-templates/CoverLetterBasicTemplate";
import CoverLetterModernTemplate from "@/components/cover-letter/desktop-templates/CoverLetterModernTemplate";

export type { CoverLetterTemplateProps, CoverLetterMobileTemplateProps };

export type CoverLetterTemplateId = "basic" | "modern";

export const coverLetterTemplates: TemplateDefinition<
  CoverLetterTemplateId,
  CoverLetterTemplateProps,
  CoverLetterMobileTemplateProps
>[] = [
  {
    id: "basic",
    name: "Basic",
    component: CoverLetterBasicTemplate,
    mobileTemplateComponent: CoverLetterBasicMobileTemplate,
  },
  {
    id: "modern",
    name: "Modern",
    component: CoverLetterModernTemplate,
    mobileTemplateComponent: CoverLetterModernMobileTemplate,
  },
];

export const defaultCoverLetterTemplateId: CoverLetterTemplateId = "basic";

export function getCoverLetterTemplate(
  id: CoverLetterTemplateId,
): TemplateDefinition<CoverLetterTemplateId, CoverLetterTemplateProps, CoverLetterMobileTemplateProps> {
  return findOrFirst(coverLetterTemplates, "id", id);
}
