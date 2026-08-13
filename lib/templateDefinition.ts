import type { ComponentType } from "react";

export interface TemplateDefinition<
  TId extends string,
  TProps extends object,
  TMobileProps extends object,
> {
  id: TId;
  name: string;
  component: ComponentType<TProps>;
  mobileTemplateComponent: ComponentType<TMobileProps>;
}
