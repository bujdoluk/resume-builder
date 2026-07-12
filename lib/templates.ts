/**
 * Registry of the three resume templates (Basic/Modern/Minimal), each
 * pairing its read-only display component (`components/templates/`) with
 * its mobile editing form (`components/mobile-forms/`) — the single source
 * `Home.tsx` and the `/templates` gallery look up templates by id from.
 */
import type { ComponentType } from "react";
import BasicMobileForm, {
  type MobileFormProps,
} from "@/components/mobile-forms/BasicMobileForm";
import ModernMobileForm from "@/components/mobile-forms/ModernMobileForm";
import MinimalMobileForm from "@/components/mobile-forms/MinimalMobileForm";
import BasicTemplate, {
  type TemplateProps,
} from "@/components/templates/BasicTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ModernTemplate from "@/components/templates/ModernTemplate";

export type { TemplateProps, MobileFormProps };

export type TemplateId = "basic" | "modern" | "minimal";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  component: ComponentType<TemplateProps>;
  mobileFormComponent: ComponentType<MobileFormProps>;
}

export const templates: TemplateDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    component: BasicTemplate,
    mobileFormComponent: BasicMobileForm,
  },
  {
    id: "modern",
    name: "Modern",
    component: ModernTemplate,
    mobileFormComponent: ModernMobileForm,
  },
  {
    id: "minimal",
    name: "Minimal",
    component: MinimalTemplate,
    mobileFormComponent: MinimalMobileForm,
  },
];

export const defaultTemplateId: TemplateId = "basic";
