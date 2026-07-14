/**
 * Registry of cover letter templates, mirroring `lib/templates.ts`'s
 * resume registry — just one entry today (Basic), but structured the same
 * way so the Navbar's template thumbnail picker and any future template
 * additions follow the same pattern as the resume side.
 */
import type { ComponentType } from "react";
import CoverLetterBasicTemplate, {
  type CoverLetterTemplateProps,
} from "@/components/cover-letter/CoverLetterBasicTemplate";

export type { CoverLetterTemplateProps };

export type CoverLetterTemplateId = "basic";

export interface CoverLetterTemplateDefinition {
  id: CoverLetterTemplateId;
  name: string;
  component: ComponentType<CoverLetterTemplateProps>;
}

export const coverLetterTemplates: CoverLetterTemplateDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    component: CoverLetterBasicTemplate,
  },
];

export const defaultCoverLetterTemplateId: CoverLetterTemplateId = "basic";
