import { Fragment } from "react";
import type { FieldKey } from "@/components/AppState";
import {
  AddressIcon,
  EmailIcon,
  LinkedInIcon,
  PhoneIcon,
  WebsiteIcon,
} from "@/components/Icons";
import { fontsByKey, type FontKey } from "@/lib/fonts";
import type { ResumeData, SectionKey } from "@/lib/resumeData";

export interface TemplateProps {
  data: ResumeData;
  sectionOrder: SectionKey[];
  color?: string | null;
  font?: FontKey | null;
  visibleFields?: FieldKey[];
}

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

/**
 * Third template: a clean, centered-header single column with no icons or
 * timeline dots — entries are set off with a thin left accent border instead.
 */
export default function MinimalTemplate({
  data,
  sectionOrder,
  color,
  font,
  visibleFields,
}: TemplateProps) {
  const isVisible = (key: FieldKey) =>
    !visibleFields || visibleFields.includes(key);
  const fontFamily = font ? fontsByKey[font].variable : undefined;

  const fullName =
    [
      isVisible("title") && data.title,
      isVisible("name") && data.name,
    ]
      .filter(Boolean)
      .join(" ") || "Your Name";

  type ContactPart = { Icon: typeof AddressIcon; value: string };

  const contactParts: ContactPart[] = [
    data.address && isVisible("address")
      ? { Icon: AddressIcon, value: data.address }
      : null,
    data.phone && isVisible("phone")
      ? { Icon: PhoneIcon, value: data.phone }
      : null,
    data.email && isVisible("email")
      ? { Icon: EmailIcon, value: data.email }
      : null,
    data.website && isVisible("website")
      ? { Icon: WebsiteIcon, value: data.website }
      : null,
    data.linkedin && isVisible("linkedin")
      ? { Icon: LinkedInIcon, value: data.linkedin }
      : null,
  ].filter((part): part is ContactPart => part !== null);

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

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workHistory: workEntries.length > 0 && (
      <>
        <SectionTitle color={color}>Work History</SectionTitle>
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
                    <p className="font-semibold">{entry.position}</p>
                  )}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap text-gray-500">
                      {dateRange}
                    </p>
                  )}
                </div>
                {entry.location && (
                  <p className="text-sm text-gray-500">{entry.location}</p>
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
        <SectionTitle color={color}>Education</SectionTitle>
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
                <div className="flex items-baseline justify-between gap-2">
                  {entry.subject && (
                    <p className="font-semibold">{entry.subject}</p>
                  )}
                  {dateRange && (
                    <p className="text-sm whitespace-nowrap text-gray-500">
                      {dateRange}
                    </p>
                  )}
                </div>
                {entry.location && (
                  <p className="text-sm text-gray-500">{entry.location}</p>
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

    skills: skillEntries.length > 0 && (
      <>
        <SectionTitle color={color}>Skills</SectionTitle>
        <p className="text-gray-700">
          {skillEntries.map((entry) => entry.value).join(" · ")}
        </p>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <SectionTitle color={color}>Certifications</SectionTitle>
        <div className="flex flex-col gap-1">
          {certificationEntries.map((entry) => (
            <p key={entry.id} className="text-gray-700">
              <span className="font-semibold">{entry.name}</span>
              {entry.date && (
                <span className="text-sm text-gray-500"> — {entry.date}</span>
              )}
            </p>
          ))}
        </div>
      </>
    ),

    languages: languageEntries.length > 0 && (
      <>
        <SectionTitle color={color}>Languages</SectionTitle>
        <p className="text-gray-700">
          {languageEntries
            .map((entry) => `${entry.language} (${entry.level})`)
            .join(" · ")}
        </p>
      </>
    ),

    interests: interestEntries.length > 0 && (
      <>
        <SectionTitle color={color}>Interests</SectionTitle>
        <p className="text-gray-700">
          {interestEntries.map((entry) => entry.value).join(" · ")}
        </p>
      </>
    ),
  };

  return (
    <div
      className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily }}
    >
      <div className="p-10">
        <div className="flex flex-col items-center text-center">
          {data.photo && isVisible("photo") && (
            <div className="avatar mb-3">
              <div className="w-20 rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset */}
                <img
                  src={data.photo}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-wide">{fullName}</h1>
          {data.jobTitle && isVisible("jobTitle") && (
            <p className="text-primary mt-1 text-sm font-semibold tracking-[0.15em] uppercase">
              {data.jobTitle}
            </p>
          )}
          {contactParts.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {contactParts.map(({ Icon, value }, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 shrink-0 stroke-current" />
                  {value}
                </span>
              ))}
            </div>
          )}
        </div>

        {data.aboutMe && isVisible("aboutMe") && (
          <>
            <SectionTitle color={color}>About Me</SectionTitle>
            <p className="whitespace-pre-line text-gray-700">
              {data.aboutMe}
            </p>
          </>
        )}

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
