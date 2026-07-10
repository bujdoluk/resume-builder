"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import type { SectionKey } from "@/lib/resumeData";
import { sampleResumeData } from "@/lib/sampleResumeData";
import { templates } from "@/lib/templates";

const allSections: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "languages",
  "interests",
];

export default function TemplatesPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <div className="bg-base-200 flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold">{t("templates.pageTitle")}</h1>

        <div className="flex flex-wrap gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/app?template=${template.id}`}
              className="group flex flex-col items-center gap-3"
            >
              <TemplateThumbnail width={220}>
                <template.component
                  data={sampleResumeData}
                  sectionOrder={allSections}
                />
              </TemplateThumbnail>
              <span className="font-medium group-hover:underline">
                {t(`templates.${template.id}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
