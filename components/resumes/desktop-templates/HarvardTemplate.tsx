"use client";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateProps } from "@/components/resumes/desktop-templates/BasicTemplate";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontSizeStyle } from "@/lib/fontSize";
import { renderFieldItems } from "@/lib/renderFieldItems";
import {
  filledHonorAwardEntries,
  filledLeadershipEntries,
} from "@/lib/resumeContent";
import { languageLevelKey, type SectionKey } from "@/lib/resumeData";

const HARVARD_FONT_FAMILY = '"Times New Roman", Times, serif';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-3 border-b border-black pb-1 text-sm font-bold tracking-[0.2em] uppercase">
      {children}
    </h2>
  );
}

// Harvard's style is locked (see the parent conversation's decision): color
// and font are always ignored here, photo is always excluded regardless of
// visibleFields, and no icons are rendered anywhere — this is what makes it
// "official" rather than just another customizable template.
export default function HarvardTemplate({
  data,
  sectionOrder,
  fontSize,
  visibleFields,
}: TemplateProps) {
  const { t } = useTranslation();
  const isVisible = (key: FieldKey) =>
    (!visibleFields || visibleFields.includes(key)) && key !== "photo";
  const fieldOrder = (visibleFields ?? allFields).filter((key) => key !== "photo");
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
  const leadershipEntries = filledLeadershipEntries(data);
  const honorAwardEntries = filledHonorAwardEntries(data);

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workExperience: workEntries.length > 0 && (
      <>
        <SectionTitle>{t("sections.workExperience")}</SectionTitle>
        <div className="flex flex-col gap-3">
          {workEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div key={entry.id}>
                <div className="flex items-baseline justify-between gap-2">
                  {entry.position && (
                    <p className="font-bold">{entry.position}</p>
                  )}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap">{dateRange}</p>
                  )}
                </div>
                {entry.location && <p className="text-sm">{entry.location}</p>}
                {entry.jobDescription && (
                  <p className="mt-1 text-sm whitespace-pre-line">
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
        <SectionTitle>{t("sections.education")}</SectionTitle>
        <div className="flex flex-col gap-3">
          {educationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div key={entry.id}>
                <div className="flex items-baseline justify-between gap-2">
                  {entry.school && <p className="font-bold">{entry.school}</p>}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap">{dateRange}</p>
                  )}
                </div>
                {entry.subject && <p className="text-sm">{entry.subject}</p>}
                {entry.location && <p className="text-sm">{entry.location}</p>}
                {entry.description && (
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {entry.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </>
    ),

    skills: skillEntries.length > 0 && (
      <>
        <SectionTitle>{t("sections.skills")}</SectionTitle>
        <p className="text-sm">
          {skillEntries.map((entry) => entry.value).join(" · ")}
        </p>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <SectionTitle>{t("sections.certifications")}</SectionTitle>
        <div className="flex flex-col gap-2">
          {certificationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");
            return (
              <div key={entry.id} className="flex items-baseline justify-between gap-2">
                <p className="font-bold">{entry.name}</p>
                {dateRange && (
                  <p className="text-sm whitespace-nowrap">{dateRange}</p>
                )}
              </div>
            );
          })}
        </div>
      </>
    ),

    languages: languageEntries.length > 0 && (
      <>
        <SectionTitle>{t("sections.languages")}</SectionTitle>
        <p className="text-sm">
          {languageEntries
            .map((entry) => `${entry.language} (${t(languageLevelKey(entry.level))})`)
            .join(" · ")}
        </p>
      </>
    ),

    interests: interestEntries.length > 0 && (
      <>
        <SectionTitle>{t("sections.interests")}</SectionTitle>
        <p className="text-sm">
          {interestEntries.map((entry) => entry.value).join(" · ")}
        </p>
      </>
    ),

    customFields: Boolean(data.customFieldValue) && (
      <>
        <SectionTitle>{data.customFieldsTitle || t("sections.customFields")}</SectionTitle>
        <p className="text-sm">{data.customFieldValue}</p>
      </>
    ),
  };

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name: isVisible("name") && (
      <h1 className="text-3xl font-bold tracking-wide uppercase">{data.name}</h1>
    ),

    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <p className="text-sm">{data.jobTitle}</p>
    ),

    phone: data.phone && isVisible("phone") && (
      <span className="text-sm">{data.phone}</span>
    ),

    email: data.email && isVisible("email") && (
      <span className="text-sm">{data.email}</span>
    ),

    address: data.address && isVisible("address") && (
      <span className="text-sm">{data.address}</span>
    ),

    website: data.website && isVisible("website") && (
      <span className="text-sm">{data.website}</span>
    ),

    linkedin: data.linkedin && isVisible("linkedin") && (
      <span className="text-sm">{data.linkedin}</span>
    ),

    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <div className="w-full text-left">
        <SectionTitle>{t("fields.aboutMe")}</SectionTitle>
        <p className="text-sm whitespace-pre-line">{data.aboutMe}</p>
      </div>
    ),
  };

  return (
    <div
      className="resume-scalable w-[210mm] min-h-[297mm] bg-white text-black shadow-xl print:shadow-none"
      style={{ fontFamily: HARVARD_FONT_FAMILY, ...fontSizeStyle }}
    >
      <div className="p-10">
        <div className="flex flex-col items-center gap-1 text-center">
          {renderFieldItems(fieldOrder, fieldContent, {
            packContactFields: true,
            contactRowClassName: "flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm",
          })}
        </div>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}

        {leadershipEntries.length > 0 && (
          <>
            <SectionTitle>{t("sections.leadershipExperience")}</SectionTitle>
            <div className="flex flex-col gap-3">
              {leadershipEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <div key={entry.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      {entry.position && (
                        <p className="font-bold">{entry.position}</p>
                      )}
                      {dateRange && (
                        <p className="text-sm whitespace-nowrap">{dateRange}</p>
                      )}
                    </div>
                    {entry.location && <p className="text-sm">{entry.location}</p>}
                    {entry.jobDescription && (
                      <p className="mt-1 text-sm whitespace-pre-line">
                        {entry.jobDescription}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {honorAwardEntries.length > 0 && (
          <>
            <SectionTitle>{t("sections.honorsAwards")}</SectionTitle>
            <div className="flex flex-col gap-2">
              {honorAwardEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <div key={entry.id} className="flex items-baseline justify-between gap-2">
                    <div>
                      {entry.name && <p className="font-bold">{entry.name}</p>}
                      {entry.issuer && <p className="text-sm">{entry.issuer}</p>}
                    </div>
                    {dateRange && (
                      <p className="text-sm whitespace-nowrap">{dateRange}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
