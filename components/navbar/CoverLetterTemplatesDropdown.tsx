"use client";

/**
 * Navbar button showing the cover letter's template as a thumbnail — the
 * cover letter counterpart of `TemplatesDropdown.tsx`. Only one template
 * (Basic) exists today, via `lib/coverLetterTemplates.ts`'s registry, but
 * the UI is structured the same way so future additions plug in identically
 * to the resume side.
 */
import { useTranslation } from "react-i18next";
import { TemplatesIcon } from "@/components/Icons";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { coverLetterTemplates } from "@/lib/coverLetterTemplates";
import { sampleCoverLetterData } from "@/lib/sampleCoverLetterData";

export default function CoverLetterTemplatesDropdown() {
  const { t } = useTranslation();

  return (
    <NavbarDropdownButton
      icon={<TemplatesIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.templates")}
      panelClassName="w-auto"
      align="start"
    >
      <div className="flex gap-3">
        {coverLetterTemplates.map((template) => (
          <div
            key={template.id}
            className="ring-primary flex flex-col items-center gap-1 rounded-md p-1 ring-2"
          >
            <TemplateThumbnail width={210}>
              <template.component data={sampleCoverLetterData} />
            </TemplateThumbnail>
          </div>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
