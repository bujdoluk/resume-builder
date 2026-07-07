import type { ComponentType } from "react";
import BasicTemplate, {
  type TemplateProps,
} from "@/components/templates/BasicTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ModernTemplate from "@/components/templates/ModernTemplate";

export type { TemplateProps };

export type TemplateId = "basic" | "modern" | "minimal";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  component: ComponentType<TemplateProps>;
}

export const templates: TemplateDefinition[] = [
  { id: "basic", name: "Basic", component: BasicTemplate },
  { id: "modern", name: "Modern", component: ModernTemplate },
  { id: "minimal", name: "Minimal", component: MinimalTemplate },
];

export const defaultTemplateId: TemplateId = "basic";
