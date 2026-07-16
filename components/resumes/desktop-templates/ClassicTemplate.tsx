"use client";

/**
 * Read-only Classic template: a copy of BasicTemplate.tsx with a colored
 * header band (photo/name/job title/contact) at the top of the page — About
 * Me and every section stay on the plain white body below, unchanged from
 * Basic. Used for the live editor's Preview modal and the `/templates`
 * gallery — its editable counterpart is `components/resumes/Resume.tsx`, and the
 * `@react-pdf/renderer` port for downloads is
 * `components/pdf/ClassicPdfTemplate.tsx`.
 */
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
import { getFontSizeStyle } from "@/lib/fontSize";
import { fontsByKey } from "@/lib/fonts";
import { languageLevels, type SectionKey } from "@/lib/resumeData";

// Renders a field order, pairing Photo with Name/Job Title (photo left,
// text stacked right, height-matched to the photo) whenever they
// immediately follow it — matches the same pairing rule used in the
// editable form (components/resumes/Resume.tsx), so drag-reordering there is
// reflected consistently here.
function renderFieldItems(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < order.length) {
    const key = order[i];

    if (key === "photo" && fieldContent.photo) {
      const pairedKeys: FieldKey[] = [];
      let j = i + 1;
      while (
        j < order.length &&
        (order[j] === "name" || order[j] === "jobTitle") &&
        fieldContent[order[j]]
      ) {
        pairedKeys.push(order[j]);
        j++;
      }

      if (pairedKeys.length > 0) {
        nodes.push(
          <div key={key} className="flex items-stretch gap-4">
            {fieldContent.photo}
            <div className="flex flex-1 flex-col justify-center gap-1">
              {pairedKeys.map((pairedKey) => (
                <Fragment key={pairedKey}>{fieldContent[pairedKey]}</Fragment>
              ))}
            </div>
          </div>,
        );
        i = j;
        continue;
      }
    }

    nodes.push(<Fragment key={key}>{fieldContent[key]}</Fragment>);
    i++;
  }

  return nodes;
}

export default function ClassicTemplate({
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
  const headerFieldOrder = fieldOrder.filter((key) => key !== "aboutMe");
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize ?? "medium");

  const headerBgClass = color ? "" : "bg-neutral text-neutral-content";
  const headerStyle = color
    ? { backgroundColor: color, color: getContrastTextColor(color) }
    : undefined;

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

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workExperience: workEntries.length > 0 && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <WorkHistoryIcon className="h-6 w-6 stroke-current" />
          {t("sections.workExperience")}
        </h2>

        <ul className="timeline timeline-vertical timeline-compact">
          {workEntries.map((entry, index) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <li key={entry.id}>
                {index > 0 && <hr />}
                <div className="timeline-start text-base text-gray-500">
                  {dateRange}
                </div>
                <div className="timeline-middle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    className="text-primary h-3 w-3 fill-current"
                    style={color ? { color } : undefined}
                  >
                    <circle cx="10" cy="10" r="6" />
                  </svg>
                </div>
                <div className="timeline-end timeline-box">
                  {entry.position && (
                    <p className="text-lg font-semibold">{entry.position}</p>
                  )}
                  {entry.location && (
                    <p className="text-base text-gray-500">{entry.location}</p>
                  )}
                  {entry.jobDescription && (
                    <p className="mt-2 text-base whitespace-pre-line text-gray-700">
                      {entry.jobDescription}
                    </p>
                  )}
                </div>
                {index < workEntries.length - 1 && <hr />}
              </li>
            );
          })}
        </ul>
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

        <ul className="timeline timeline-vertical timeline-compact">
          {educationEntries.map((entry, index) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <li key={entry.id}>
                {index > 0 && <hr />}
                <div className="timeline-start text-base text-gray-500">
                  {dateRange}
                </div>
                <div className="timeline-middle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    className="text-primary h-3 w-3 fill-current"
                    style={color ? { color } : undefined}
                  >
                    <circle cx="10" cy="10" r="6" />
                  </svg>
                </div>
                <div className="timeline-end timeline-box">
                  {entry.school && (
                    <p className="text-lg font-semibold">{entry.school}</p>
                  )}
                  {entry.subject && (
                    <p className="text-base text-gray-600">{entry.subject}</p>
                  )}
                  {entry.location && (
                    <p className="text-base text-gray-500">{entry.location}</p>
                  )}
                  {entry.description && (
                    <p className="mt-2 text-base whitespace-pre-line text-gray-700">
                      {entry.description}
                    </p>
                  )}
                </div>
                {index < educationEntries.length - 1 && <hr />}
              </li>
            );
          })}
        </ul>
      </>
    ),

    skills: skillEntries.length > 0 && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <SkillsIcon className="h-6 w-6 stroke-current" />
          {t("sections.skills")}
        </h2>

        <ul className="flex flex-col gap-1 text-gray-700">
          {skillEntries.map((entry) => (
            <li key={entry.id}>{entry.value}</li>
          ))}
        </ul>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <CertificationsIcon className="h-6 w-6 stroke-current" />
          {t("sections.certifications")}
        </h2>

        <div className="space-y-2">
          {certificationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");
            return (
              <div key={entry.id}>
                {dateRange && (
                  <p className="text-sm text-gray-500">{dateRange}</p>
                )}
                <p className="font-semibold text-gray-700">{entry.name}</p>
              </div>
            );
          })}
        </div>
      </>
    ),

    languages: languageEntries.length > 0 && (
      <>
        <h2
          className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
          style={color ? { color } : undefined}
        >
          <LanguagesIcon className="h-6 w-6 stroke-current" />
          {t("sections.languages")}
        </h2>

        <div className="space-y-1">
          {languageEntries.map((entry) => {
            const levelIndex = languageLevels.indexOf(entry.level);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 text-gray-700"
              >
                <span className="font-semibold">{entry.language}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{entry.level}</span>
                  <div className="rating rating-sm pointer-events-none">
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

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      <div className="avatar">
        <div className="w-16 rounded-full bg-white">
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
      <h1 className="text-4xl font-bold">
        {data.name || t("placeholders.yourName")}
      </h1>
    ),

    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <p className="text-lg opacity-80">{data.jobTitle}</p>
    ),

    phone: data.phone && isVisible("phone") && (
      <p className="flex items-center gap-1.5 text-sm opacity-80">
        <PhoneIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.phone}
      </p>
    ),

    email: data.email && isVisible("email") && (
      <p className="flex items-center gap-1.5 text-sm opacity-80">
        <EmailIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.email}
      </p>
    ),

    address: data.address && isVisible("address") && (
      <p className="flex items-center gap-1.5 text-sm opacity-80">
        <AddressIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.address}
      </p>
    ),

    website: data.website && isVisible("website") && (
      <p className="flex items-center gap-1.5 text-sm opacity-80">
        <WebsiteIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.website}
      </p>
    ),

    linkedin: data.linkedin && isVisible("linkedin") && (
      <p className="flex items-center gap-1.5 text-sm opacity-80">
        <LinkedInIcon className="h-4 w-4 shrink-0 stroke-current" />
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
      className="resume-scalable w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div
        className={`flex flex-col gap-1 p-8 ${headerBgClass}`}
        style={headerStyle}
      >
        {renderFieldItems(headerFieldOrder, fieldContent)}
      </div>

      <div className="p-8">
        {fieldContent.aboutMe}

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
