"use client";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateProps } from "@/components/resumes/desktop-templates/BasicTemplate";
import { allFields, type FieldKey } from "@/lib/fields";
import {
  AddressIcon,
  EmailIcon,
  LinkedInIcon,
  PhoneIcon,
  WebsiteIcon,
} from "@/components/Icons";
import { fontsByKey } from "@/lib/fonts";
import { getFontSizeStyle } from "@/lib/fontSize";
import type { SectionKey } from "@/lib/resumeData";

function SectionTitle({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string | null;
}) {
  return (
    <h2
      className="border-primary mt-6 mb-3 border-b-2 pb-1 text-sm font-bold tracking-[0.2em] uppercase"
      style={color ? { borderColor: color } : undefined}
    >
      {children}
    </h2>
  );
}

const contactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

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
          <div key={key} className="flex items-stretch gap-4 text-left">
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

    if (contactFieldKeys.includes(key)) {
      const rowKeys: FieldKey[] = [];
      let j = i;
      while (
        j < order.length &&
        contactFieldKeys.includes(order[j]) &&
        fieldContent[order[j]]
      ) {
        rowKeys.push(order[j]);
        j++;
      }

      if (rowKeys.length > 1) {
        nodes.push(
          <div
            key={key}
            className="flex flex-wrap justify-center gap-x-4 gap-y-1"
          >
            {rowKeys.map((rowKey) => (
              <Fragment key={rowKey}>{fieldContent[rowKey]}</Fragment>
            ))}
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

export default function MinimalTemplate({
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
        <SectionTitle color={color}>{t("sections.workExperience")}</SectionTitle>
        <div className="flex flex-col gap-4">
          {workEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div
                key={entry.id}
                className="border-primary/40 border-l-2 pl-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  {entry.position && (
                    <p className="text-lg font-semibold">{entry.position}</p>
                  )}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap text-gray-500">
                      {dateRange}
                    </p>
                  )}
                </div>
                {entry.location && (
                  <p className="text-base text-gray-500">{entry.location}</p>
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
    ),

    education: educationEntries.length > 0 && (
      <>
        <SectionTitle color={color}>{t("sections.education")}</SectionTitle>
        <div className="flex flex-col gap-4">
          {educationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <div
                key={entry.id}
                className="border-primary/40 border-l-2 pl-3"
              >
                {entry.school && (
                  <p className="text-lg font-semibold">{entry.school}</p>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  {entry.subject && (
                    <p className="text-base text-gray-600">{entry.subject}</p>
                  )}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap text-gray-500">
                      {dateRange}
                    </p>
                  )}
                </div>
                {entry.location && (
                  <p className="text-base text-gray-500">{entry.location}</p>
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
    ),

    skills: skillEntries.length > 0 && (
      <>
        <SectionTitle color={color}>{t("sections.skills")}</SectionTitle>
        <ul className="flex flex-col gap-1 text-gray-700">
          {skillEntries.map((entry) => (
            <li key={entry.id}>{entry.value}</li>
          ))}
        </ul>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <SectionTitle color={color}>{t("sections.certifications")}</SectionTitle>
        <div className="flex flex-col gap-2">
          {certificationEntries.map((entry) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");
            return (
              <div key={entry.id}>
                {dateRange && (
                  <p className="text-xs text-gray-500">{dateRange}</p>
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
        <SectionTitle color={color}>{t("sections.languages")}</SectionTitle>
        <p className="text-gray-700">
          {languageEntries
            .map((entry) => `${entry.language} (${entry.level})`)
            .join(" · ")}
        </p>
      </>
    ),

    interests: interestEntries.length > 0 && (
      <>
        <SectionTitle color={color}>{t("sections.interests")}</SectionTitle>
        <p className="text-gray-700">
          {interestEntries.map((entry) => entry.value).join(" · ")}
        </p>
      </>
    ),
  };

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      <div className="avatar mb-1">
        <div className="w-20 rounded-full">
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
      <h1 className="text-4xl font-bold tracking-wide">
        {data.name || t("placeholders.yourName")}
      </h1>
    ),

    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase">
        {data.jobTitle}
      </p>
    ),

    phone: data.phone && isVisible("phone") && (
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <PhoneIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.phone}
      </p>
    ),

    email: data.email && isVisible("email") && (
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <EmailIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.email}
      </p>
    ),

    address: data.address && isVisible("address") && (
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <AddressIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.address}
      </p>
    ),

    website: data.website && isVisible("website") && (
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <WebsiteIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.website}
      </p>
    ),

    linkedin: data.linkedin && isVisible("linkedin") && (
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <LinkedInIcon className="h-4 w-4 shrink-0 stroke-current" />
        {data.linkedin}
      </p>
    ),

    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <div className="w-full text-left">
        <SectionTitle color={color}>{t("fields.aboutMe")}</SectionTitle>
        <p className="whitespace-pre-line text-gray-700">{data.aboutMe}</p>
      </div>
    ),
  };

  return (
    <div
      className="resume-scalable w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div className="p-10">
        <div className="flex flex-col items-center gap-1 text-center">
          {renderFieldItems(fieldOrder, fieldContent)}
        </div>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
