"use client";

import { useTranslation } from "react-i18next";
import { allSections, useAppState } from "@/components/AppState";
import { TemplatesIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { sampleResumeData } from "@/lib/sampleResumeData";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { templates } from "@/lib/templates";

export default function TemplatesDropdown() {
  const { t } = useTranslation();
  const { templateId, setTemplateId } = useAppState();

  return (
    <NavbarDropdownButton
      icon={<TemplatesIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.templates")}
      panelClassName="w-auto"
      align="start"
    >
      <div className="flex gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setTemplateId(template.id)}
            className={`flex flex-col items-center gap-1 rounded-md p-1 ${
              templateId === template.id ? "ring-primary ring-2" : ""
            }`}
          >
            <TemplateThumbnail width={210}>
              <template.component
                data={sampleResumeData}
                sectionOrder={allSections}
              />
            </TemplateThumbnail>
          </button>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
