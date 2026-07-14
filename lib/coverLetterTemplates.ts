/**
 * Registry of cover letter templates, mirroring `lib/templates.ts`'s
 * resume registry, so the Navbar's template thumbnail picker and the
 * builder's desktop/mobile switching follow the same pattern as the resume
 * side.
 */
import type { ComponentType } from "react";
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

export interface CoverLetterTemplateDefinition {
  id: CoverLetterTemplateId;
  name: string;
  component: ComponentType<CoverLetterTemplateProps>;
  mobileTemplateComponent: ComponentType<CoverLetterMobileTemplateProps>;
}

export const coverLetterTemplates: CoverLetterTemplateDefinition[] = [
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
