import Link from "next/link";
import Navbar from "@/components/Navbar";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import type { SectionKey } from "@/lib/resumeData";
import { sampleResumeData } from "@/lib/sampleResumeData";
import { templates } from "@/lib/templates";

const allSections: SectionKey[] = [
  "workHistory",
  "education",
  "skills",
  "languages",
  "interests",
];

export default function TemplatesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <div className="bg-base-200 flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold">Templates</h1>

        <div className="flex flex-wrap gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/?template=${template.id}`}
              className="group flex flex-col items-center gap-3"
            >
              <TemplateThumbnail width={220}>
                <template.component
                  data={sampleResumeData}
                  sectionOrder={allSections}
                />
              </TemplateThumbnail>
              <span className="font-medium group-hover:underline">
                {template.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
