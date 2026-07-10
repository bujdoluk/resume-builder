"use client";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { allFields, type FieldKey } from "@/lib/fields";
import {
  AboutMeIcon,
  AddressIcon,
  CertificationsIcon,
  EducationIcon,
  EmailIcon,
  InterestsIcon,
  LanguagesIcon,
  LinkedInIcon,
  PhoneIcon,
  SkillsIcon,
  WebsiteIcon,
  WorkHistoryIcon,
} from "@/components/Icons";
import { getContrastTextColor } from "@/lib/color";
import { fontsByKey, type FontKey } from "@/lib/fonts";
import { getFontSizeStyle, type FontSizeKey } from "@/lib/fontSize";
import {
  languageLevels,
  type ResumeData,
  type SectionKey,
} from "@/lib/resumeData";

export interface TemplateProps {
  data: ResumeData;
  sectionOrder: SectionKey[];
  color?: string | null;
  font?: FontKey | null;
  fontSize?: FontSizeKey;
  visibleFields?: FieldKey[];
}

/**
 * Starter scaffold for a second template. Reuses the same data-derivation
 * logic as BasicTemplate but lays it out as a two-column sidebar design —
 * swap the JSX below for your own look while keeping the same TemplateProps
 * shape so it drops straight into the templates registry.
 */
export default function ModernTemplate({
  data,
  sectionOrder,
  color,
  font,
  fontSize,
  visibleFields,
}: TemplateProps) {
  const { t } = useTranslation();
  const isVisible = (key: FieldKey) =>
    !visibleFields || visibleFields.includes(key);
  const fieldOrder = visibleFields ?? allFields;
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize ?? "medium");

  const workEntries = data.workExperience.filter(
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
    workExperience: workEntries.length > 0 && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <WorkHistoryIcon className="h-6 w-6 stroke-current" />
          {t("sections.workExperience")}
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
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <EducationIcon className="h-6 w-6 stroke-current" />
          {t("sections.education")}
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
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <InterestsIcon className="h-6 w-6 stroke-current" />
          {t("sections.interests")}
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
        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          <SkillsIcon className="h-5 w-5 stroke-current" />
          {t("sections.skills")}
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
        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          <CertificationsIcon className="h-5 w-5 stroke-current" />
          {t("sections.certifications")}
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
        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          <LanguagesIcon className="h-5 w-5 stroke-current" />
          {t("sections.languages")}
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

  // About Me stays spatially just before Work Experience, which lives in the
  // main column for Modern — every other field lives in the sidebar.
  const mainFieldKeys: FieldKey[] = ["aboutMe"];
  const sidebarFieldKeys = fieldOrder.filter(
    (key) => !mainFieldKeys.includes(key),
  );
  const orderedMainFieldKeys = fieldOrder.filter((key) =>
    mainFieldKeys.includes(key),
  );

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      <div className="avatar mb-2 self-center">
        <div className="w-20 rounded-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset */}
          <img
            src={data.photo}
            alt="Profile photo"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    ),

    name: isVisible("name") && (
      <h1 className="text-xl font-bold">
        {data.name || t("placeholders.yourName")}
      </h1>
    ),

    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <p className="text-sm opacity-80">{data.jobTitle}</p>
    ),

    phone: data.phone && isVisible("phone") && (
      <p className="flex items-center gap-1.5 text-xs opacity-80">
        <PhoneIcon className="h-3.5 w-3.5 shrink-0 stroke-current" />
        {data.phone}
      </p>
    ),

    email: data.email && isVisible("email") && (
      <p className="flex items-center gap-1.5 text-xs opacity-80">
        <EmailIcon className="h-3.5 w-3.5 shrink-0 stroke-current" />
        {data.email}
      </p>
    ),

    address: data.address && isVisible("address") && (
      <p className="flex items-center gap-1.5 text-xs opacity-80">
        <AddressIcon className="h-3.5 w-3.5 shrink-0 stroke-current" />
        {data.address}
      </p>
    ),

    website: data.website && isVisible("website") && (
      <p className="flex items-center gap-1.5 text-xs opacity-80">
        <WebsiteIcon className="h-3.5 w-3.5 shrink-0 stroke-current" />
        {data.website}
      </p>
    ),

    linkedin: data.linkedin && isVisible("linkedin") && (
      <p className="flex items-center gap-1.5 text-xs opacity-80">
        <LinkedInIcon className="h-3.5 w-3.5 shrink-0 stroke-current" />
        {data.linkedin}
      </p>
    ),

    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <AboutMeIcon className="h-6 w-6 stroke-current" />
          {t("fields.aboutMe")}
        </h2>
        <p className="whitespace-pre-line text-gray-700">{data.aboutMe}</p>
      </>
    ),
  };

  return (
    <div
      className="resume-scalable grid w-[210mm] min-h-[297mm] grid-cols-[70mm_1fr] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div
        className="modern-sidebar bg-neutral text-neutral-content flex flex-col gap-2 p-6"
        style={
          color
            ? ({
                backgroundColor: color,
                color: getContrastTextColor(color),
                "--sidebar-fg": getContrastTextColor(color),
              } as React.CSSProperties)
            : undefined
        }
      >
        {sidebarFieldKeys.map((key) => (
          <Fragment key={key}>{fieldContent[key]}</Fragment>
        ))}

        {sidebarKeys.map((key) => (
          <Fragment key={key}>{sidebarSectionContent[key]}</Fragment>
        ))}
      </div>

      <div className="p-6">
        {orderedMainFieldKeys.map((key) => (
          <Fragment key={key}>{fieldContent[key]}</Fragment>
        ))}
        {mainKeys.map((key) => (
          <Fragment key={key}>{mainSectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
