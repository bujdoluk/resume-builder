/**
 * Registry of the three resume templates (Basic/Modern/Minimal), each
 * pairing its read-only desktop display component
 * (`components/desktop-templates/`) with its mobile editing template
 * (`components/mobile-templates/`) — the single source `Home.tsx` and the
 * `/templates` gallery look up templates by id from.
 */
import type { ComponentType } from "react";
import BasicMobileTemplate, {
  type MobileTemplateProps,
} from "@/components/mobile-templates/BasicMobileTemplate";
import ElegantMobileTemplate from "@/components/mobile-templates/ElegantMobileTemplate";
import ModernMobileTemplate from "@/components/mobile-templates/ModernMobileTemplate";
import MinimalMobileTemplate from "@/components/mobile-templates/MinimalMobileTemplate";
import BasicTemplate, {
  type TemplateProps,
} from "@/components/desktop-templates/BasicTemplate";
import ElegantTemplate from "@/components/desktop-templates/ElegantTemplate";
import MinimalTemplate from "@/components/desktop-templates/MinimalTemplate";
import ModernTemplate from "@/components/desktop-templates/ModernTemplate";

export type { TemplateProps, MobileTemplateProps };

export type TemplateId = "basic" | "modern" | "minimal" | "elegant";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  component: ComponentType<TemplateProps>;
  mobileTemplateComponent: ComponentType<MobileTemplateProps>;
}

export const templates: TemplateDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    component: BasicTemplate,
    mobileTemplateComponent: BasicMobileTemplate,
  },
  {
    id: "modern",
    name: "Modern",
    component: ModernTemplate,
    mobileTemplateComponent: ModernMobileTemplate,
  },
  {
    id: "minimal",
    name: "Minimal",
    component: MinimalTemplate,
    mobileTemplateComponent: MinimalMobileTemplate,
  },
  {
    id: "elegant",
    name: "Elegant",
    component: ElegantTemplate,
    mobileTemplateComponent: ElegantMobileTemplate,
  },
];

export const defaultTemplateId: TemplateId = "basic";
