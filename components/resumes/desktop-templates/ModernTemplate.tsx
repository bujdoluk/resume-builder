"use client";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateProps } from "@/components/resumes/desktop-templates/BasicTemplate";
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
import { fontsByKey } from "@/lib/fonts";
import { getFontSizeStyle } from "@/lib/fontSize";
import {
  languageLevels,
  resolveModernSectionZone,
  splitSectionsByZone,
  type SectionKey,
} from "@/lib/resumeData";

function SectionHeader({
  icon,
  title,
  zone,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  zone: "main" | "sidebar";
  color?: string | null;
}) {
  if (zone === "sidebar") {
    return (
      <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
        {icon}
        {title}
      </h2>
    );
  }
  return (
    <h2
      className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
      style={color ? { color } : undefined}
    >
      {icon}
      {title}
    </h2>
  );
}

export default function ModernTemplate({
  data,
  sectionOrder,
  color,
  font,
  fontSize,
  visibleFields,
  sectionZones,
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
      entry.school ||
      entry.subject ||
      entry.location ||
      entry.description ||
      entry.dateFrom ||
      entry.dateTo,
  );

  const skillEntries = data.skills.filter((entry) => entry.value);
  const certificationEntries = data.certifications.filter(
    (entry) => entry.name || entry.dateFrom || entry.dateTo,
  );
  const languageEntries = data.languages.filter((entry) => entry.language);
  const interestEntries = data.interests.filter((entry) => entry.value);

  function renderSection(
    key: SectionKey,
    zone: "main" | "sidebar",
  ): React.ReactNode {
    const iconClassName =
      zone === "sidebar" ? "h-5 w-5 stroke-current" : "h-6 w-6 stroke-current";

    switch (key) {
      case "workExperience": {
        if (workEntries.length === 0) return null;
        if (zone === "sidebar") {
          return (
            <>
              <SectionHeader
                icon={<WorkHistoryIcon className={iconClassName} />}
                title={t("sections.workExperience")}
                zone={zone}
              />
              <ul className="flex flex-col gap-1">
                {workEntries.map((entry) => {
                  const dateRange = [entry.dateFrom, entry.dateTo]
                    .filter(Boolean)
                    .join(" – ");
                  return (
                    <li key={entry.id}>
                      {entry.position}
                      {(dateRange || entry.location) && (
                        <span className="block text-xs opacity-70">
                          {[dateRange, entry.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          );
        }
        return (
          <>
            <SectionHeader
              icon={<WorkHistoryIcon className={iconClassName} />}
              title={t("sections.workExperience")}
              zone={zone}
              color={color}
            />
            <div className="flex flex-col gap-3">
              {workEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo]
                  .filter(Boolean)
                  .join(" – ");

                return (
                  <div key={entry.id}>
                    {entry.position && (
                      <p className="text-lg font-semibold">
                        {entry.position}
                      </p>
                    )}
                    {(dateRange || entry.location) && (
                      <p className="text-sm text-gray-500">
                        {[dateRange, entry.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {entry.jobDescription && (
                      <p className="mt-1 text-base whitespace-pre-line text-gray-700">
                        {entry.jobDescription}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      }

      case "education": {
        if (educationEntries.length === 0) return null;
        if (zone === "sidebar") {
          return (
            <>
              <SectionHeader
                icon={<EducationIcon className={iconClassName} />}
                title={t("sections.education")}
                zone={zone}
              />
              <ul className="flex flex-col gap-1">
                {educationEntries.map((entry) => {
                  const dateRange = [entry.dateFrom, entry.dateTo]
                    .filter(Boolean)
                    .join(" – ");
                  return (
                    <li key={entry.id}>
                      {entry.school}
                      {(entry.subject || dateRange || entry.location) && (
                        <span className="block text-xs opacity-70">
                          {[entry.subject, dateRange, entry.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          );
        }
        return (
          <>
            <SectionHeader
              icon={<EducationIcon className={iconClassName} />}
              title={t("sections.education")}
              zone={zone}
              color={color}
            />
            <div className="flex flex-col gap-3">
              {educationEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo]
                  .filter(Boolean)
                  .join(" – ");

                return (
                  <div key={entry.id}>
                    {entry.school && (
                      <p className="text-lg font-semibold">{entry.school}</p>
                    )}
                    {entry.subject && (
                      <p className="text-base text-gray-600">
                        {entry.subject}
                      </p>
                    )}
                    {(dateRange || entry.location) && (
                      <p className="text-sm text-gray-500">
                        {[dateRange, entry.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {entry.description && (
                      <p className="mt-1 text-base whitespace-pre-line text-gray-700">
                        {entry.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      }

      case "interests": {
        if (interestEntries.length === 0) return null;
        return (
          <>
            <SectionHeader
              icon={<InterestsIcon className={iconClassName} />}
              title={t("sections.interests")}
              zone={zone}
              color={zone === "main" ? color : undefined}
            />
            <p className="text-gray-700">
              {interestEntries.map((entry) => entry.value).join(", ")}
            </p>
          </>
        );
      }

      case "skills": {
        if (skillEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <>
              <SectionHeader
                icon={<SkillsIcon className={iconClassName} />}
                title={t("sections.skills")}
                zone={zone}
                color={color}
              />
              <ul className="flex flex-col gap-1 text-gray-700">
                {skillEntries.map((entry) => (
                  <li key={entry.id}>{entry.value}</li>
                ))}
              </ul>
            </>
          );
        }
        return (
          <>
            <SectionHeader
              icon={<SkillsIcon className={iconClassName} />}
              title={t("sections.skills")}
              zone={zone}
            />
            <ul className="flex flex-col gap-1">
              {skillEntries.map((entry) => (
                <li key={entry.id}>{entry.value}</li>
              ))}
            </ul>
          </>
        );
      }

      case "certifications": {
        if (certificationEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <>
              <SectionHeader
                icon={<CertificationsIcon className={iconClassName} />}
                title={t("sections.certifications")}
                zone={zone}
                color={color}
              />
              <div className="flex flex-col gap-3">
                {certificationEntries.map((entry) => {
                  const dateRange = [entry.dateFrom, entry.dateTo]
                    .filter(Boolean)
                    .join(" – ");
                  return (
                    <div key={entry.id}>
                      {dateRange && (
                        <p className="text-sm text-gray-500">{dateRange}</p>
                      )}
                      <p className="text-lg font-semibold">{entry.name}</p>
                    </div>
                  );
                })}
              </div>
            </>
          );
        }
        return (
          <>
            <SectionHeader
              icon={<CertificationsIcon className={iconClassName} />}
              title={t("sections.certifications")}
              zone={zone}
            />
            <ul className="flex flex-col gap-1">
              {certificationEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <li key={entry.id}>
                    {dateRange && (
                      <span className="block text-xs opacity-70">
                        {dateRange}
                      </span>
                    )}
                    {entry.name}
                  </li>
                );
              })}
            </ul>
          </>
        );
      }

      case "languages": {
        if (languageEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <>
              <SectionHeader
                icon={<LanguagesIcon className={iconClassName} />}
                title={t("sections.languages")}
                zone={zone}
                color={color}
              />
              <div className="flex flex-col gap-2">
                {languageEntries.map((entry) => {
                  const levelIndex = languageLevels.indexOf(entry.level);
                  return (
                    <div key={entry.id}>
                      <p className="text-lg font-semibold">
                        {entry.language}
                      </p>
                      <div className="rating rating-sm pointer-events-none">
                        {languageLevels.map((level, index) => (
                          <input
                            key={level}
                            type="radio"
                            aria-label={level}
                            className="mask mask-star"
                            style={color ? { backgroundColor: color } : undefined}
                            defaultChecked={index === levelIndex}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        }
        return (
          <>
            <SectionHeader
              icon={<LanguagesIcon className={iconClassName} />}
              title={t("sections.languages")}
              zone={zone}
            />
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
                          style={color ? { backgroundColor: color } : undefined}
                          defaultChecked={index === levelIndex}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
    }
  }

  const { sidebar: sidebarKeys, main: mainKeys } = splitSectionsByZone(
    sectionOrder,
    sectionZones ?? {},
  );

  const aboutMeZone = resolveModernSectionZone("aboutMe", sectionZones ?? {});
  const sidebarFieldKeys = fieldOrder.filter((key) => key !== "aboutMe");

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
      <h1 className="text-2xl font-bold">
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
        <SectionHeader
          icon={
            <AboutMeIcon
              className={
                aboutMeZone === "sidebar"
                  ? "h-5 w-5 stroke-current"
                  : "h-6 w-6 stroke-current"
              }
            />
          }
          title={t("fields.aboutMe")}
          zone={aboutMeZone}
          color={color}
        />
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

        {aboutMeZone === "sidebar" && isVisible("aboutMe") && fieldContent.aboutMe}

        {sidebarKeys.map((key) => (
          <Fragment key={key}>{renderSection(key, "sidebar")}</Fragment>
        ))}
      </div>

      <div className="p-6">
        {aboutMeZone === "main" && isVisible("aboutMe") && fieldContent.aboutMe}
        {mainKeys.map((key) => (
          <Fragment key={key}>{renderSection(key, "main")}</Fragment>
        ))}
      </div>
    </div>
  );
}
