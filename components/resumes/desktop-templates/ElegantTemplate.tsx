"use client";

import dynamic from "next/dynamic";
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

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function LanguageDonut({ percent, color }: { percent: number; color: string }) {

  const chartValue = Math.max(percent, 1);

  return (
    <ApexChart
      type="radialBar"
      width={80}
      height={80}
      series={[chartValue]}
      options={{
        chart: {
          sparkline: { enabled: true },

          redrawOnParentResize: false,
          redrawOnWindowResize: false,
          animations: { enabled: false },
        },
        colors: [color],
        stroke: { lineCap: "round" },
        plotOptions: {
          radialBar: {
            hollow: { size: "55%" },
            track: { background: "rgba(128,128,128,0.3)" },
            dataLabels: {
              name: { show: false },
              value: {
                show: true,
                offsetY: 5,
                fontSize: "12px",
                fontWeight: 600,
                color,
                formatter: () => `${percent}%`,
              },
            },
          },
        },
      }}
    />
  );
}

// Section header in either of Elegant's two zone looks — identical rule to
// Modern's SectionHeader: accent-colored icon+text in the main column, or a
// smaller opacity-70 look with no accent color in the sidebar, so a section
// keeps whichever style matches the zone it's currently placed in.
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

// Renders each non-empty line of a description as its own numbered bullet
// instead of a single whitespace-pre-line paragraph — Elegant's most
// distinctive touch, borrowed from the reference resume this template was
// modeled after.
function NumberedLines({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ol className="mt-1 list-decimal space-y-1 pl-5 text-base text-gray-700">
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ol>
  );
}

// Contact fields pack onto a shared, wrapping row instead of stacking
// one-per-line, matching how the reference resume shows its contact details.
const contactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

// Renders the main column's field order (photo is excluded — it's fixed to
// the sidebar for this template — so no photo-pairing rule is needed here,
// unlike Basic/Minimal's renderFieldItems).
function renderMainFields(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < order.length) {
    const key = order[i];

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
          <div key={key} className="flex flex-wrap gap-x-4 gap-y-1">
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

export default function ElegantTemplate({
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
  const mainFieldOrder = (visibleFields ?? allFields).filter(
    (key) => key !== "photo" && key !== "aboutMe",
  );
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize ?? "medium");
  const sidebarFg = color ? getContrastTextColor(color) : "#ffffff";

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
                      <NumberedLines text={entry.jobDescription} />
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

      case "skills": {
        if (skillEntries.length === 0) return null;
        if (zone === "sidebar") {
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
        if (zone === "sidebar") {
          return (
            <>
              <SectionHeader
                icon={<LanguagesIcon className={iconClassName} />}
                title={t("sections.languages")}
                zone={zone}
              />
              <div className="flex flex-col gap-2">
                {languageEntries.map((entry) => {
                  const levelIndex = languageLevels.indexOf(entry.level);
                  const percent = Math.round(
                    (Math.max(levelIndex, 0) / (languageLevels.length - 1)) *
                      100,
                  );
                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <div className="shrink-0">
                        <LanguageDonut percent={percent} color={sidebarFg} />
                      </div>
                      <span className="text-sm">{entry.language}</span>
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
              color={color}
            />
            <div className="flex flex-col gap-1">
              {languageEntries.map((entry) => (
                <p key={entry.id} className="text-gray-700">
                  <span className="font-semibold">{entry.language}</span>
                  <span className="text-sm text-gray-500"> — {entry.level}</span>
                </p>
              ))}
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
            <p className={zone === "sidebar" ? undefined : "text-gray-700"}>
              {interestEntries.map((entry) => entry.value).join(", ")}
            </p>
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

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name: isVisible("name") && (
      <h1 className="text-4xl font-bold">
        {data.name || t("placeholders.yourName")}
      </h1>
    ),

    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <p className="text-lg font-semibold" style={color ? { color } : undefined}>
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
      className="resume-scalable grid w-[210mm] min-h-[297mm] grid-cols-[1fr_80mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div className="p-6">
        <div className="flex flex-col gap-1">
          {renderMainFields(mainFieldOrder, fieldContent)}
        </div>

        {aboutMeZone === "main" && isVisible("aboutMe") && fieldContent.aboutMe}
        {mainKeys.map((key) => (
          <Fragment key={key}>{renderSection(key, "main")}</Fragment>
        ))}
      </div>

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
        {data.photo && isVisible("photo") && (
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
        )}

        {aboutMeZone === "sidebar" && isVisible("aboutMe") && fieldContent.aboutMe}

        {sidebarKeys.map((key) => (
          <Fragment key={key}>{renderSection(key, "sidebar")}</Fragment>
        ))}
      </div>
    </div>
  );
}
