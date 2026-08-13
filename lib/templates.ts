
import type { TemplateDefinition } from "@/lib/templateDefinition";
import BasicMobileTemplate, {
  type MobileTemplateProps,
} from "@/components/resumes/mobile-templates/BasicMobileTemplate";
import ClassicMobileTemplate from "@/components/resumes/mobile-templates/ClassicMobileTemplate";
import ElegantMobileTemplate from "@/components/resumes/mobile-templates/ElegantMobileTemplate";
import ModernMobileTemplate from "@/components/resumes/mobile-templates/ModernMobileTemplate";
import MinimalMobileTemplate from "@/components/resumes/mobile-templates/MinimalMobileTemplate";
import BasicTemplate, {
  type TemplateProps,
} from "@/components/resumes/desktop-templates/BasicTemplate";
import ClassicTemplate from "@/components/resumes/desktop-templates/ClassicTemplate";
import ElegantTemplate from "@/components/resumes/desktop-templates/ElegantTemplate";
import MinimalTemplate from "@/components/resumes/desktop-templates/MinimalTemplate";
import ModernTemplate from "@/components/resumes/desktop-templates/ModernTemplate";

export type { TemplateProps, MobileTemplateProps };

export type TemplateId = "basic" | "modern" | "minimal" | "elegant" | "classic";

export const templates: TemplateDefinition<TemplateId, TemplateProps, MobileTemplateProps>[] = [
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
  {
    id: "classic",
    name: "Classic",
    component: ClassicTemplate,
    mobileTemplateComponent: ClassicMobileTemplate,
  },
];

export const defaultTemplateId: TemplateId = "basic";
