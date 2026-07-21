"use client";

import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { TemplatesIcon } from "@/components/Icons";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { coverLetterTemplates } from "@/lib/coverLetterTemplates";
import { sampleCoverLetterData } from "@/lib/sampleCoverLetterData";

export default function CoverLetterTemplatesDropdown() {
  const { t } = useTranslation();
  const { coverLetterTemplateId, setCoverLetterTemplateId } = useAppState();

  return (
    <NavbarDropdownButton
      icon={<TemplatesIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.templates")}
      panelClassName="w-auto"
      align="start"
    >
      <div className="flex gap-3">
        {coverLetterTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setCoverLetterTemplateId(template.id)}
            className={`flex flex-col items-center gap-1 rounded-md p-1 ${
              coverLetterTemplateId === template.id ? "ring-primary ring-2" : ""
            }`}
          >
            <TemplateThumbnail width={210}>
              <template.component data={sampleCoverLetterData} />
            </TemplateThumbnail>
          </button>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
