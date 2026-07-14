"use client";

/**
 * Navbar button for switching the resume's template — shown as a menu of
 * template thumbnails (like Colours' swatches), not a link to the separate
 * `/templates` gallery page. Picking one just updates the shared
 * `AppState.templateId` in place — no navigation, so `ResumeBuilder.tsx`'s in-memory
 * resume `data` is completely untouched (unlike the `/templates` gallery
 * flow, which starts a fresh blank resume under the new template).
 */
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
