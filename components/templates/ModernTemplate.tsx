import { Fragment } from "react";
import {
  languageLevels,
  type ResumeData,
  type SectionKey,
} from "@/lib/resumeData";

export interface TemplateProps {
  data: ResumeData;
  sectionOrder: SectionKey[];
}

/**
 * Starter scaffold for a second template. Reuses the same data-derivation
 * logic as BasicTemplate but lays it out as a two-column sidebar design —
 * swap the JSX below for your own look while keeping the same TemplateProps
 * shape so it drops straight into the templates registry.
 */
export default function ModernTemplate({ data, sectionOrder }: TemplateProps) {
  const fullName =
    [data.title, data.name].filter(Boolean).join(" ") || "Your Name";

  const workEntries = data.workHistory.filter(
    (entry) =>
      entry.position ||
      entry.location ||
      entry.jobDescription ||
      entry.dateFrom ||
      entry.dateTo,
  );

  const educationEntries = data.education.filter(
    (entry) =>
      entry.subject ||
      entry.location ||
      entry.description ||
      entry.dateFrom ||
      entry.dateTo,
  );

  const skillEntries = data.skills.filter((entry) => entry.value);
  const certificationEntries = data.certifications.filter(
    (entry) => entry.name || entry.date,
  );
  const languageEntries = data.languages.filter((entry) => entry.language);
  const interestEntries = data.interests.filter((entry) => entry.value);

  const mainSectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workHistory: workEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Work History
        </h2>
        <div className="flex flex-col gap-3">
          {workEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div key={entry.id}>
                {entry.position && (
                  <p className="font-semibold">{entry.position}</p>
                )}
                {(dateRange || entry.location) && (
                  <p className="text-sm text-gray-500">
                    {[dateRange, entry.location].filter(Boolean).join(" · ")}
                  </p>
                )}
                {entry.jobDescription && (
                  <p className="mt-1 whitespace-pre-line text-gray-700">
                    {entry.jobDescription}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </>
    ),

    education: educationEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Education
        </h2>
        <div className="flex flex-col gap-3">
          {educationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div key={entry.id}>
                {entry.subject && (
                  <p className="font-semibold">{entry.subject}</p>
                )}
                {(dateRange || entry.location) && (
                  <p className="text-sm text-gray-500">
                    {[dateRange, entry.location].filter(Boolean).join(" · ")}
                  </p>
                )}
                {entry.description && (
                  <p className="mt-1 whitespace-pre-line text-gray-700">
                    {entry.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </>
    ),

    interests: interestEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Interests
        </h2>
        <p className="text-gray-700">
          {interestEntries.map((entry) => entry.value).join(", ")}
        </p>
      </>
    ),
  };

  const sidebarSectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    skills: skillEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          Skills
        </h2>
        <ul className="flex flex-col gap-1">
          {skillEntries.map((entry) => (
            <li key={entry.id}>{entry.value}</li>
          ))}
        </ul>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          Certifications
        </h2>
        <ul className="flex flex-col gap-1">
          {certificationEntries.map((entry) => (
            <li key={entry.id}>
              {entry.name}
              {entry.date && (
                <span className="block text-xs opacity-70">{entry.date}</span>
              )}
            </li>
          ))}
        </ul>
      </>
    ),

    languages: languageEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          Languages
        </h2>
        <div className="flex flex-col gap-1">
          {languageEntries.map((entry) => {
            const levelIndex = languageLevels.indexOf(entry.level);

            return (
              <div key={entry.id}>
                <p>{entry.language}</p>
                <div className="rating rating-xs pointer-events-none">
                  {languageLevels.map((level, index) => (
                    <input
                      key={level}
                      type="radio"
                      aria-label={level}
                      className="mask mask-star"
                      defaultChecked={index === levelIndex}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    ),
  };

  // Sidebar sections render in a fixed order; everything else follows
  // sectionOrder in the main column.
  const sidebarKeys: SectionKey[] = ["skills", "certifications", "languages"];
  const mainKeys = sectionOrder.filter((key) => !sidebarKeys.includes(key));

  return (
    <div className="grid w-[210mm] min-h-[297mm] grid-cols-[70mm_1fr] bg-white shadow-xl print:shadow-none">
      <div className="modern-sidebar bg-neutral text-neutral-content flex flex-col gap-2 p-6">
        {data.photo && (
          <div className="avatar mb-2">
            <div className="w-20 rounded-full bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset */}
              <img
                src={data.photo}
                alt="Profile photo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <h1 className="text-xl font-bold">{fullName}</h1>
        {data.jobTitle && <p className="text-sm opacity-80">{data.jobTitle}</p>}

        <div className="mt-2 flex flex-col gap-1 text-xs opacity-80">
          {data.address && <p>{data.address}</p>}
          {data.phone && <p>{data.phone}</p>}
          {data.email && <p>{data.email}</p>}
          {data.website && <p>{data.website}</p>}
        </div>

        {sidebarKeys.map((key) => (
          <Fragment key={key}>{sidebarSectionContent[key]}</Fragment>
        ))}
      </div>

      <div className="p-6">
        {mainKeys.map((key) => (
          <Fragment key={key}>{mainSectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
