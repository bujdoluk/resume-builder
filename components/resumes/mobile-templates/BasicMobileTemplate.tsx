"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import {
  CertificationsIcon,
  EducationIcon,
  InterestsIcon,
  LanguagesIcon,
  SkillsIcon,
  WorkHistoryIcon,
} from "@/components/Icons";
import {
  renderFieldItems,
  reorderEntries,
  SortableBlock,
  SortableGroup,
} from "@/components/Sortable";
import { createResumeFormHandlers } from "@/components/useResumeFormHandlers";
import { getContrastTextColor } from "@/lib/color";
import { type FieldKey } from "@/lib/fields";
import {
  languageLevels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ModernSectionZones,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";

type WorkEntryFieldKey =
  | "position"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "jobDescription";
const defaultWorkFieldOrder: WorkEntryFieldKey[] = [
  "position",
  "dateFrom",
  "dateTo",
  "location",
  "jobDescription",
];

type EducationEntryFieldKey =
  | "school"
  | "subject"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "description";
const defaultEducationFieldOrder: EducationEntryFieldKey[] = [
  "school",
  "subject",
  "dateFrom",
  "dateTo",
  "location",
  "description",
];

export interface MobileTemplateProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onWorkHistoryChange: (workExperience: WorkEntry[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onSkillsChange: (skills: SimpleEntry[]) => void;
  onCertificationsChange: (certifications: CertificationEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
  onInterestsChange: (interests: SimpleEntry[]) => void;
  sectionOrder: SectionKey[];
  onReorderSections: (order: SectionKey[]) => void;
  visibleFields: FieldKey[];
  onReorderFields: (order: FieldKey[]) => void;
  modernSectionZones: ModernSectionZones;
  onChangeModernSectionZones: React.Dispatch<
    React.SetStateAction<ModernSectionZones>
  >;
  color: string | null;
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="btn btn-square btn-ghost"
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="h-4 w-4 stroke-current"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color?: string | null;
}) {
  return (
    <div className="mt-4 mb-2">
      <h2
        className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
        style={color ? { color } : undefined}
      >
        {icon}
        {title}
      </h2>
    </div>
  );
}

export default function BasicMobileTemplate({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onCertificationsChange,
  onLanguagesChange,
  onInterestsChange,
  sectionOrder,
  onReorderSections,
  visibleFields,
  onReorderFields,
  color,
}: MobileTemplateProps) {
  const { t } = useTranslation();
  const handlers = createResumeFormHandlers({
    data,
    onChange,
    onWorkHistoryChange,
    onEducationChange,
    onSkillsChange,
    onCertificationsChange,
    onLanguagesChange,
    onInterestsChange,
  });
  const [workFieldOrder, setWorkFieldOrder] = useState(defaultWorkFieldOrder);
  const [educationFieldOrder, setEducationFieldOrder] = useState(
    defaultEducationFieldOrder,
  );

  function workEntryFields(
    entry: WorkEntry,
  ): Record<WorkEntryFieldKey, React.ReactNode> {
    return {
      position: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.yourPosition")}
            className="input input-plain w-full"
            value={entry.position}
            onChange={(e) =>
              handlers.updateWorkEntry(entry.id, "position", e.target.value)
            }
          />
        </fieldset>
      ),
      dateFrom: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.startDateWork")}
            className="input input-plain w-full"
            value={entry.dateFrom}
            onChange={(e) =>
              handlers.updateWorkEntry(entry.id, "dateFrom", e.target.value)
            }
          />
        </fieldset>
      ),
      dateTo: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.endDateWork")}
            className="input input-plain w-full"
            value={entry.dateTo}
            onChange={(e) =>
              handlers.updateWorkEntry(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
      location: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder="Location"
            className="input input-plain w-full"
            value={entry.location}
            onChange={(e) =>
              handlers.updateWorkEntry(entry.id, "location", e.target.value)
            }
          />
        </fieldset>
      ),
      jobDescription: (
        <fieldset className="fieldset">
          <AutoResizeTextarea
            placeholder={t("placeholders.describeResponsibilities")}
            className="textarea input-plain w-full"
            value={entry.jobDescription}
            onChange={(e) =>
              handlers.updateWorkEntry(
                entry.id,
                "jobDescription",
                e.target.value,
              )
            }
          />
        </fieldset>
      ),
    };
  }

  function educationEntryFields(
    entry: EducationEntry,
  ): Record<EducationEntryFieldKey, React.ReactNode> {
    return {
      school: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.schoolName")}
            className="input input-plain w-full"
            value={entry.school}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "school", e.target.value)
            }
          />
        </fieldset>
      ),
      subject: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.subjectOfStudy")}
            className="input input-plain w-full"
            value={entry.subject}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "subject", e.target.value)
            }
          />
        </fieldset>
      ),
      dateFrom: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.startDateEducation")}
            className="input input-plain w-full"
            value={entry.dateFrom}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "dateFrom", e.target.value)
            }
          />
        </fieldset>
      ),
      dateTo: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.endDateEducation")}
            className="input input-plain w-full"
            value={entry.dateTo}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
      location: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder="Location"
            className="input input-plain w-full"
            value={entry.location}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "location", e.target.value)
            }
          />
        </fieldset>
      ),
      description: (
        <fieldset className="fieldset">
          <AutoResizeTextarea
            placeholder={t("placeholders.describeStudies")}
            className="textarea input-plain w-full"
            value={entry.description}
            onChange={(e) =>
              handlers.updateEducationEntry(
                entry.id,
                "description",
                e.target.value,
              )
            }
          />
        </fieldset>
      ),
    };
  }

  const avatar = !visibleFields.includes("photo") ? null : (
    <label
      className="avatar avatar-placeholder relative w-fit cursor-pointer"
      aria-label={t("aria.uploadProfilePhoto")}
    >
      <div
        className="bg-neutral text-neutral-content h-24 w-24 rounded-full"
        style={
          color
            ? { backgroundColor: color, color: getContrastTextColor(color) }
            : undefined
        }
      >
        {data.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset
          <img
            src={data.photo}
            alt="Profile photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-8 w-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 16.5V4.5m0 0-4 4m4-4 4 4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"
              />
            </svg>
            <span className="text-xs font-medium">
              {t("placeholders.uploadPhoto")}
            </span>
          </div>
        )}
      </div>
      {data.photo && (
        <button
          type="button"
          aria-label={t("aria.removePhoto")}
          className="btn btn-circle btn-xs absolute top-0 right-0 bg-white text-neutral"
          style={
            color ? { backgroundColor: getContrastTextColor(color), color } : undefined
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlers.removePhoto();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-3 w-3 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlers.handlePhotoChange}
      />
    </label>
  );

  const name = !visibleFields.includes("name") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourName")}
        className="input input-plain w-full text-3xl font-bold"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
    </fieldset>
  );

  const jobTitle = !visibleFields.includes("jobTitle") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourJobTitle")}
        className="input input-plain w-full text-lg text-gray-600"
        value={data.jobTitle}
        onChange={(e) => onChange("jobTitle", e.target.value)}
      />
    </fieldset>
  );

  const phone = !visibleFields.includes("phone") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a12.045 12.045 0 0 1-5.688-5.688l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
          />
        </svg>
        <input
          type="tel"
          placeholder={t("placeholders.yourPhone")}
          className="grow"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const email = !visibleFields.includes("email") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
        <input
          type="email"
          placeholder={t("placeholders.yourEmail")}
          className="grow"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const address = !visibleFields.includes("address") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <input
          type="text"
          placeholder={t("placeholders.yourAddress")}
          className="grow"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const website = !visibleFields.includes("website") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
        <input
          type="text"
          placeholder={t("placeholders.yourWebsite")}
          className="grow"
          value={data.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const linkedin = !visibleFields.includes("linkedin") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
        <input
          type="text"
          placeholder={t("placeholders.yourLinkedIn")}
          className="grow"
          value={data.linkedin}
          onChange={(e) => onChange("linkedin", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      <h2
        className="mt-4 mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
        style={color ? { color } : undefined}
      >
        {t("fields.aboutMe")}
      </h2>
      <AutoResizeTextarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea input-plain w-full"
        value={data.aboutMe}
        onChange={(e) => onChange("aboutMe", e.target.value)}
      />
    </div>
  );

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: avatar,
    name,
    jobTitle,
    phone,
    email,
    address,
    website,
    linkedin,
    aboutMe,
  };

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionHeader
          icon={<WorkHistoryIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.workExperience")}
          color={color}
        />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="work-history-entries"
            ids={data.workExperience.map((entry) => entry.id)}
            onReorder={(order) =>
              onWorkHistoryChange(reorderEntries(data.workExperience, order))
            }
          >
            {data.workExperience.map((entry) => {
              const fields = workEntryFields(entry);
              return (
                <SortableBlock
                  key={entry.id}
                  id={entry.id}
                  className="flex flex-col gap-2 rounded-lg p-4"
                >
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeWorkExperience")}
                      onClick={() => handlers.removeWorkEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`work-fields-${entry.id}`}
                    ids={workFieldOrder}
                    onReorder={setWorkFieldOrder}
                  >
                    {workFieldOrder.map((key) => (
                      <SortableBlock key={key} id={key}>
                        {fields[key]}
                      </SortableBlock>
                    ))}
                  </SortableGroup>
                </SortableBlock>
              );
            })}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addWorkEntry}
          >
            {t("buttons.addWorkExperience")}
          </button>
        </div>
      </>
    ),

    education: (
      <>
        <SectionHeader
          icon={<EducationIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.education")}
          color={color}
        />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="education-entries"
            ids={data.education.map((entry) => entry.id)}
            onReorder={(order) =>
              onEducationChange(reorderEntries(data.education, order))
            }
          >
            {data.education.map((entry) => {
              const fields = educationEntryFields(entry);
              return (
                <SortableBlock
                  key={entry.id}
                  id={entry.id}
                  className="flex flex-col gap-2 rounded-lg p-4"
                >
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeEducation")}
                      onClick={() => handlers.removeEducationEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`education-fields-${entry.id}`}
                    ids={educationFieldOrder}
                    onReorder={setEducationFieldOrder}
                  >
                    {educationFieldOrder.map((key) => (
                      <SortableBlock key={key} id={key}>
                        {fields[key]}
                      </SortableBlock>
                    ))}
                  </SortableGroup>
                </SortableBlock>
              );
            })}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addEducationEntry}
          >
            {t("buttons.addEducation")}
          </button>
        </div>
      </>
    ),

    skills: (
      <>
        <SectionHeader
          icon={<SkillsIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.skills")}
          color={color}
        />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="skills-entries"
            ids={data.skills.map((entry) => entry.id)}
            onReorder={(order) =>
              onSkillsChange(reorderEntries(data.skills, order))
            }
          >
            {data.skills.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end gap-2">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourSkill")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) => handlers.updateSkill(entry.id, e.target.value)}
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeSkill")}
                    onClick={() => handlers.removeSkill(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addSkill}
          >
            {t("buttons.addSkill")}
          </button>
        </div>
      </>
    ),

    certifications: (
      <>
        <SectionHeader
          icon={<CertificationsIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.certifications")}
          color={color}
        />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="certifications-entries"
            ids={data.certifications.map((entry) => entry.id)}
            onReorder={(order) =>
              onCertificationsChange(reorderEntries(data.certifications, order))
            }
          >
            {data.certifications.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <fieldset className="fieldset flex-1">
                      <input
                        type="text"
                        placeholder={t("placeholders.certificationDateFrom")}
                        className="input w-full"
                        value={entry.dateFrom}
                        onChange={(e) =>
                          handlers.updateCertification(entry.id, "dateFrom", e.target.value)
                        }
                      />
                    </fieldset>
                    <fieldset className="fieldset flex-1">
                      <input
                        type="text"
                        placeholder={t("placeholders.certificationDateTo")}
                        className="input w-full"
                        value={entry.dateTo}
                        onChange={(e) =>
                          handlers.updateCertification(entry.id, "dateTo", e.target.value)
                        }
                      />
                    </fieldset>
                  </div>
                  <div className="flex items-end gap-2">
                    <fieldset className="fieldset flex-1">
                      <input
                        type="text"
                        placeholder={t("placeholders.certificationName")}
                        className="input w-full"
                        value={entry.name}
                        onChange={(e) =>
                          handlers.updateCertification(entry.id, "name", e.target.value)
                        }
                      />
                    </fieldset>
                    <RemoveButton
                      label={t("aria.removeCertification")}
                      onClick={() => handlers.removeCertification(entry.id)}
                    />
                  </div>
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addCertification}
          >
            {t("buttons.addCertification")}
          </button>
        </div>
      </>
    ),

    languages: (
      <>
        <SectionHeader
          icon={<LanguagesIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.languages")}
          color={color}
        />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="languages-entries"
            ids={data.languages.map((entry) => entry.id)}
            onReorder={(order) =>
              onLanguagesChange(reorderEntries(data.languages, order))
            }
          >
            {data.languages.map((entry) => {
              const levelIndex = languageLevels.indexOf(entry.level);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex items-center gap-2 rounded-lg p-4">
                    <fieldset className="fieldset min-w-0 flex-1">
                      <input
                        type="text"
                        placeholder={t("placeholders.yourLanguage")}
                        className="input w-full"
                        value={entry.language}
                        onChange={(e) =>
                          handlers.updateLanguage(
                            entry.id,
                            "language",
                            e.target.value,
                          )
                        }
                      />
                    </fieldset>
                    <div
                      className="flex shrink-0 items-center gap-2"
                      aria-label="Language proficiency level"
                    >
                      <span className="shrink-0 text-xs whitespace-nowrap text-gray-500">
                        {entry.level}
                      </span>
                      <div className="rating shrink-0 pl-2">
                        {languageLevels.map((level, index) => (
                          <input
                            key={level}
                            type="radio"
                            name={`basic-mobile-language-level-${entry.id}`}
                            aria-label={level}
                            className="mask mask-star"
                            style={color ? { backgroundColor: color } : undefined}
                            checked={index === levelIndex}
                            onChange={() =>
                              handlers.updateLanguage(entry.id, "level", level)
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <RemoveButton
                      label={t("aria.removeLanguage")}
                      onClick={() => handlers.removeLanguage(entry.id)}
                    />
                  </div>
                </SortableBlock>
              );
            })}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addLanguage}
          >
            {t("buttons.addLanguage")}
          </button>
        </div>
      </>
    ),

    interests: (
      <>
        <SectionHeader
          icon={<InterestsIcon className="h-6 w-6 stroke-current" />}
          title={t("sections.interests")}
          color={color}
        />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="interests-entries"
            ids={data.interests.map((entry) => entry.id)}
            onReorder={(order) =>
              onInterestsChange(reorderEntries(data.interests, order))
            }
          >
            {data.interests.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end gap-2">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourInterest")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) => handlers.updateInterest(entry.id, e.target.value)}
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeInterest")}
                    onClick={() => handlers.removeInterest(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={handlers.addInterest}
          >
            {t("buttons.addInterest")}
          </button>
        </div>
      </>
    ),
  };

  return (
    <div className="resume-scalable flex flex-col gap-4 bg-white pl-8">
      <div data-section-anchor="personalInfo">
        <SortableGroup
          dndId="basic-mobile-fields"
          ids={visibleFields}
          onReorder={onReorderFields}
        >
          <div className="flex flex-col gap-4">
            {renderFieldItems(visibleFields, fieldContent)}
          </div>
        </SortableGroup>
      </div>

      <SortableGroup
        dndId="basic-mobile-sections"
        ids={sectionOrder}
        onReorder={onReorderSections}
      >
        <div className="flex flex-col gap-2">
          {sectionOrder.map((key) => (
            <SortableBlock key={key} id={key} anchor>
              {sectionContent[key]}
            </SortableBlock>
          ))}
        </div>
      </SortableGroup>
    </div>
  );
}
