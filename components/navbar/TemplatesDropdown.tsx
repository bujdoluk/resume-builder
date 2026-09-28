"use client";

import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { TemplatesIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { sampleResumeData } from "@/lib/sampleResumeData";
import { getDefaultSectionOrder, sectionOrderForTemplate } from "@/lib/sectionOrder";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { templates, type TemplateId } from "@/lib/templates";

export default function TemplatesDropdown() {
  const { t } = useTranslation();
  const { templateId, setTemplateId, setSectionOrder } = useAppState();

  function selectTemplate(id: TemplateId) {
    setTemplateId(id);
    setSectionOrder((prev) => sectionOrderForTemplate(prev, id));
  }

  return (
    <NavbarDropdownButton
      icon={<TemplatesIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.templates")}
      panelClassName="w-max max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] overflow-y-auto"
      align="start"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => selectTemplate(template.id)}
            className={`flex flex-col items-center gap-1 rounded-md p-1 ${
              templateId === template.id ? "ring-primary ring-2" : ""
            }`}
          >
            <TemplateThumbnail width={210}>
              <template.component
                data={sampleResumeData}
                sectionOrder={getDefaultSectionOrder(template.id)}
              />
            </TemplateThumbnail>
          </button>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
