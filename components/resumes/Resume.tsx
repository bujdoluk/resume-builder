"use client";

import { rectSortingStrategy } from "@dnd-kit/sortable";
import { Fragment, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { FieldKey } from "@/components/AppState";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { AboutMeIcon } from "@/components/Icons";
import {
  renderFieldItems,
  reorderEntries,
  SortableBlock,
  SortableGroup,
  SortableZone,
  SortableZones,
} from "@/components/Sortable";
import { useModernZoneLayout } from "@/components/useModernZoneLayout";
import { getContrastTextColor } from "@/lib/color";
import { getFontSizeStyle, type FontSizeKey } from "@/lib/fontSize";
import { generateId } from "@/lib/generateId";
import { formatPhoneAsYouType } from "@/lib/phone";
import { fontsByKey, type FontKey } from "@/lib/fonts";
import {
  emptyResumeData,
  languageLevels,
  sectionLabels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ModernSectionZones,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";
import type { TemplateId } from "@/lib/templates";

export {
  emptyResumeData,
  languageLevels,
  sectionLabels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
};

interface ResumeProps {
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
  templateId: TemplateId;
  color: string | null;
  font: FontKey | null;
  fontSize: FontSizeKey;
  visibleFields: FieldKey[];
  onReorderFields: (order: FieldKey[]) => void;
  modernSectionZones: ModernSectionZones;
  onChangeModernSectionZones: Dispatch<SetStateAction<ModernSectionZones>>;
}

const modernMainFieldKeys: FieldKey[] = ["aboutMe"];

type WorkEntryFieldKey =
  | "position"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "jobDescription";
const defaultWorkHistoryFieldOrder: WorkEntryFieldKey[] = [
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

type LanguageEntryFieldKey = "language" | "level";
const defaultLanguageFieldOrder: LanguageEntryFieldKey[] = [
  "language",
  "level",
];

type CertificationEntryFieldKey = "dateFrom" | "dateTo" | "name";
const defaultCertificationFieldOrder: CertificationEntryFieldKey[] = [
  "dateFrom",
  "dateTo",
  "name",
];

function RemoveButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
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
  variant = "main",
  color,
}: {
  icon: React.ReactNode;
  title: string;
  variant?: "main" | "minimal" | "sidebar";
  color?: string | null;
}) {
  if (variant === "minimal") {
    return (
      <div
        className="border-primary mt-6 mb-3 border-b-2 pb-1"
        style={color ? { borderColor: color } : undefined}
      >
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
          {title}
        </h2>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="mt-4 mb-2">
        <h2 className="flex items-center text-sm font-semibold tracking-wide uppercase opacity-70">
          {icon}
          {title}
        </h2>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-2">
      <h2
        className="flex items-center text-sm font-semibold tracking-wide text-gray-500 uppercase"
        style={color ? { color } : undefined}
      >
        {icon}
        {title}
      </h2>
    </div>
  );
}

export default function Resume({
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
  templateId,
  color,
  font,
  fontSize,
  visibleFields,
  onReorderFields,
  modernSectionZones,
  onChangeModernSectionZones,
}: ResumeProps) {
  const { t } = useTranslation();
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize);

  const [workHistoryFieldOrder, setWorkHistoryFieldOrder] = useState(
    defaultWorkHistoryFieldOrder,
  );
  const [educationFieldOrder, setEducationFieldOrder] = useState(
    defaultEducationFieldOrder,
  );
  const [languageFieldOrder, setLanguageFieldOrder] = useState(
    defaultLanguageFieldOrder,
  );
  const [certificationFieldOrder, setCertificationFieldOrder] = useState(
    defaultCertificationFieldOrder,
  );

  const { sidebarItems, mainItems, onZonesChange } = useModernZoneLayout({
    sectionOrder,
    onReorderSections,
    modernSectionZones,
    setModernSectionZones: onChangeModernSectionZones,
    visibleFields,
  });

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange("photo", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    onChange("photo", "");
  }

  function addWorkEntry() {
    onWorkHistoryChange([
      ...data.workExperience,
      {
        id: generateId(),
        position: "",
        dateFrom: "",
        dateTo: "",
        location: "",
        jobDescription: "",
      },
    ]);
  }

  function updateWorkEntry(
    id: string,
    field: Exclude<keyof WorkEntry, "id">,
    value: string,
  ) {
    onWorkHistoryChange(
      data.workExperience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeWorkEntry(id: string) {
    onWorkHistoryChange(data.workExperience.filter((entry) => entry.id !== id));
  }

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
              updateWorkEntry(entry.id, "position", e.target.value)
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
              updateWorkEntry(entry.id, "dateFrom", e.target.value)
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
              updateWorkEntry(entry.id, "dateTo", e.target.value)
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
              updateWorkEntry(entry.id, "location", e.target.value)
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
              updateWorkEntry(entry.id, "jobDescription", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addEducationEntry() {
    onEducationChange([
      ...data.education,
      {
        id: generateId(),
        school: "",
        subject: "",
        location: "",
        description: "",
        dateFrom: "",
        dateTo: "",
      },
    ]);
  }

  function updateEducationEntry(
    id: string,
    field: Exclude<keyof EducationEntry, "id">,
    value: string,
  ) {
    onEducationChange(
      data.education.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeEducationEntry(id: string) {
    onEducationChange(data.education.filter((entry) => entry.id !== id));
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
              updateEducationEntry(entry.id, "school", e.target.value)
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
              updateEducationEntry(entry.id, "subject", e.target.value)
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
              updateEducationEntry(entry.id, "dateFrom", e.target.value)
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
              updateEducationEntry(entry.id, "dateTo", e.target.value)
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
              updateEducationEntry(entry.id, "location", e.target.value)
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
              updateEducationEntry(entry.id, "description", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addSkill() {
    onSkillsChange([...data.skills, { id: generateId(), value: "" }]);
  }

  function updateSkill(id: string, value: string) {
    onSkillsChange(
      data.skills.map((entry) =>
        entry.id === id ? { ...entry, value } : entry,
      ),
    );
  }

  function removeSkill(id: string) {
    onSkillsChange(data.skills.filter((entry) => entry.id !== id));
  }

  function addCertification() {
    onCertificationsChange([
      ...data.certifications,
      { id: generateId(), name: "", dateFrom: "", dateTo: "" },
    ]);
  }

  function updateCertification(
    id: string,
    field: Exclude<keyof CertificationEntry, "id">,
    value: string,
  ) {
    onCertificationsChange(
      data.certifications.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeCertification(id: string) {
    onCertificationsChange(
      data.certifications.filter((entry) => entry.id !== id),
    );
  }

  function certificationEntryFields(
    entry: CertificationEntry,
  ): Record<CertificationEntryFieldKey, React.ReactNode> {
    return {
      name: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.certificationName")}
            className="input w-full"
            value={entry.name}
            onChange={(e) =>
              updateCertification(entry.id, "name", e.target.value)
            }
          />
        </fieldset>
      ),
      dateFrom: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.certificationDateFrom")}
            className="input w-full"
            value={entry.dateFrom}
            onChange={(e) =>
              updateCertification(entry.id, "dateFrom", e.target.value)
            }
          />
        </fieldset>
      ),
      dateTo: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.certificationDateTo")}
            className="input w-full"
            value={entry.dateTo}
            onChange={(e) =>
              updateCertification(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addLanguage() {
    onLanguagesChange([
      ...data.languages,
      { id: generateId(), language: "", level: languageLevels[0] },
    ]);
  }

  function updateLanguage(
    id: string,
    field: "language" | "level",
    value: string,
  ) {
    onLanguagesChange(
      data.languages.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeLanguage(id: string) {
    onLanguagesChange(data.languages.filter((entry) => entry.id !== id));
  }

  function languageEntryFields(
    entry: LanguageEntry,
  ): Record<LanguageEntryFieldKey, React.ReactNode> {
    const levelIndex = languageLevels.indexOf(entry.level);

    return {
      language: (
        <fieldset className="fieldset min-w-0">
          <input
            type="text"
            placeholder={t("placeholders.yourLanguage")}
            className="input w-full min-w-0"
            value={entry.language}
            onChange={(e) =>
              updateLanguage(entry.id, "language", e.target.value)
            }
          />
        </fieldset>
      ),
      level: (
        <div
          className="flex items-center py-1"
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
                name={`canvas-language-level-${entry.id}`}
                aria-label={level}
                className="mask mask-star"
                style={color ? { backgroundColor: color } : undefined}
                checked={index === levelIndex}
                onChange={() => updateLanguage(entry.id, "level", level)}
              />
            ))}
          </div>
        </div>
      ),
    };
  }

  function addInterest() {
    onInterestsChange([
      ...data.interests,
      { id: generateId(), value: "" },
    ]);
  }

  function updateInterest(id: string, value: string) {
    onInterestsChange(
      data.interests.map((entry) =>
        entry.id === id ? { ...entry, value } : entry,
      ),
    );
  }

  function removeInterest(id: string) {
    onInterestsChange(data.interests.filter((entry) => entry.id !== id));
  }

  const entryCardClass =
    templateId === "minimal"
      ? "border-primary/40 flex flex-col border-l-2 pl-3"
      : "flex flex-col  rounded-lg p-4";

  // Modern and Elegant's sections restyle their header to match whichever
  // zone they're currently placed in (see useModernZoneLayout's
  // sidebarItems above) — Basic always uses "main", Minimal always uses
  // "minimal".
  function sectionVariant(key: SectionKey): "main" | "minimal" | "sidebar" {
    if (templateId === "minimal") return "minimal";
    if (
      (templateId === "modern" || templateId === "elegant") &&
      sidebarItems.includes(key)
    )
      return "sidebar";
    return "main";
  }

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionHeader
          title={t("sections.workExperience")}
          variant={sectionVariant("workExperience")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <rect
                x="3"
                y="7.5"
                width="18"
                height="12"
                rx="1.5"
                strokeWidth="1.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 12.75h18"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
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
                  className={entryCardClass}
                >
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeWorkExperience")}
                      onClick={() => removeWorkEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`work-history-fields-${entry.id}`}
                    ids={workHistoryFieldOrder}
                    onReorder={setWorkHistoryFieldOrder}
                  >
                    {workHistoryFieldOrder.map((key) => (
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
            onClick={addWorkEntry}
          >
            {t("buttons.addWorkExperience")}
          </button>
        </div>
      </>
    ),

    education: (
      <>
        <SectionHeader
          title={t("sections.education")}
          variant={sectionVariant("education")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m2.25 9 9.75-4.5L21.75 9l-9.75 4.5L2.25 9Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6 11.25v4.5c0 .621 2.686 2.25 6 2.25s6-1.629 6-2.25v-4.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M21.75 9v6"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
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
                  className={entryCardClass}
                >
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeEducation")}
                      onClick={() => removeEducationEntry(entry.id)}
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
            onClick={addEducationEntry}
          >
            {t("buttons.addEducation")}
          </button>
        </div>
      </>
    ),

    skills: (
      <>
        <SectionHeader
          title={t("sections.skills")}
          variant={sectionVariant("skills")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
          <SortableGroup
            dndId="skills-entries"
            ids={data.skills.map((entry) => entry.id)}
            onReorder={(order) =>
              onSkillsChange(reorderEntries(data.skills, order))
            }
          >
            {data.skills.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourSkill")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) => updateSkill(entry.id, e.target.value)}
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeSkill")}
                    onClick={() => removeSkill(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addSkill}
          >
            {t("buttons.addSkill")}
          </button>
        </div>
      </>
    ),

    certifications: (
      <>
        <SectionHeader
          title={t("sections.certifications")}
          variant={sectionVariant("certifications")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <circle cx="12" cy="8" r="5" strokeWidth="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m8.5 12.5-1.5 7 5-3 5 3-1.5-7"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
          <SortableGroup
            dndId="certifications-entries"
            ids={data.certifications.map((entry) => entry.id)}
            onReorder={(order) =>
              onCertificationsChange(
                reorderEntries(data.certifications, order),
              )
            }
          >
            {data.certifications.map((entry) => {
              const fields = certificationEntryFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex flex-col">
                    <div className="flex justify-end">
                      <RemoveButton
                        label={t("aria.removeCertification")}
                        onClick={() => removeCertification(entry.id)}
                      />
                    </div>
                    <SortableGroup
                      dndId={`certification-fields-${entry.id}`}
                      ids={certificationFieldOrder}
                      onReorder={setCertificationFieldOrder}
                    >
                      {certificationFieldOrder.map((key) => (
                        <SortableBlock key={key} id={key}>
                          {fields[key]}
                        </SortableBlock>
                      ))}
                    </SortableGroup>
                  </div>
                </SortableBlock>
              );
            })}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addCertification}
          >
            {t("buttons.addCertification")}
          </button>
        </div>
      </>
    ),

    languages: (
      <>
        <SectionHeader
          title={t("sections.languages")}
          variant={sectionVariant("languages")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
          <SortableGroup
            dndId="languages-entries"
            ids={data.languages.map((entry) => entry.id)}
            onReorder={(order) =>
              onLanguagesChange(reorderEntries(data.languages, order))
            }
          >
            {data.languages.map((entry) => {
              const fields = languageEntryFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex flex-col">
                    <div className="flex justify-end">
                      <RemoveButton
                        label={t("aria.removeLanguage")}
                        onClick={() => removeLanguage(entry.id)}
                      />
                    </div>
                    <SortableGroup
                      dndId={`language-fields-${entry.id}`}
                      ids={languageFieldOrder}
                      onReorder={setLanguageFieldOrder}
                    >
                      <div className="flex items-center gap-2">
                        {languageFieldOrder.map((key) => (
                          <SortableBlock
                            key={key}
                            id={key}
                            className={key === "language" ? "min-w-0 flex-1" : "shrink-0"}
                          >
                            {fields[key]}
                          </SortableBlock>
                        ))}
                      </div>
                    </SortableGroup>
                  </div>
                </SortableBlock>
              );
            })}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addLanguage}
          >
            {t("buttons.addLanguage")}
          </button>
        </div>
      </>
    ),

    interests: (
      <>
        <SectionHeader
          title={t("sections.interests")}
          variant={sectionVariant("interests")}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 20.25c-.318 0-.633-.088-.906-.262C7.499 17.577 3 14.15 3 9.75 3 7.026 5.132 4.9 7.79 4.9c1.6 0 3.049.789 3.96 2.017a.7.7 0 0 0 .5.208.7.7 0 0 0 .5-.208A4.897 4.897 0 0 1 16.71 4.9C19.368 4.9 21.5 7.026 21.5 9.75c0 4.4-4.5 7.827-8.594 10.238-.273.174-.588.262-.906.262Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col">
          <SortableGroup
            dndId="interests-entries"
            ids={data.interests.map((entry) => entry.id)}
            onReorder={(order) =>
              onInterestsChange(reorderEntries(data.interests, order))
            }
          >
            {data.interests.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourInterest")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) =>
                        updateInterest(entry.id, e.target.value)
                      }
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeInterest")}
                    onClick={() => removeInterest(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addInterest}
          >
            {t("buttons.addInterest")}
          </button>
        </div>
      </>
    ),
  };

  const avatarBgClass =
    templateId === "modern" || templateId === "elegant" || templateId === "classic"
      ? "bg-white text-neutral"
      : "bg-neutral text-neutral-content";
  const avatarStyle =
    templateId !== "modern" && templateId !== "elegant" && templateId !== "classic" && color
      ? { backgroundColor: color, color: getContrastTextColor(color) }
      : undefined;

  const removeButtonBgClass =
    templateId === "modern" || templateId === "elegant" || templateId === "classic"
      ? "bg-neutral text-neutral-content"
      : "bg-white text-neutral";
  const removeButtonStyle =
    templateId !== "modern" && templateId !== "elegant" && templateId !== "classic" && color
      ? { backgroundColor: getContrastTextColor(color), color }
      : undefined;

  const avatar = !visibleFields.includes("photo") ? null : (
    <div
      className={
        templateId === "modern" || templateId === "elegant"
          ? "flex justify-center"
          : undefined
      }
    >
      <label
        className="avatar avatar-placeholder relative cursor-pointer items-center justify-center"
        aria-label={t("aria.uploadProfilePhoto")}
      >
        <div
          className={`h-32 w-32 rounded-full ${avatarBgClass}`}
          style={avatarStyle}
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
                className="h-10 w-10 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 16.5V4.5m0 0-4 4m4-4 4 4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"
                />
              </svg>
              <span className="text-xs font-medium">{t("placeholders.uploadPhoto")}</span>
            </div>
          )}
        </div>
        {data.photo && (
          <button
            type="button"
            aria-label={t("aria.removePhoto")}
            className={`btn btn-circle btn-xs absolute top-0 right-0 ${removeButtonBgClass}`}
            style={removeButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removePhoto();
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
          onChange={handlePhotoChange}
        />
      </label>
    </div>
  );

  const name = !visibleFields.includes("name") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        name="name"
        placeholder={t("placeholders.yourName")}
        className="input w-full"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
    </fieldset>
  );

  const jobTitle = !visibleFields.includes("jobTitle") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        name="jobTitle"
        placeholder={t("placeholders.yourJobTitle")}
        className="input w-full"
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
          style={color ? { color } : undefined}
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
          name="phone"
          placeholder={t("placeholders.yourPhone")}
          className="grow"
          value={data.phone}
          onChange={(e) => onChange("phone", formatPhoneAsYouType(e.target.value))}
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
          style={color ? { color } : undefined}
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
          name="email"
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
          style={color ? { color } : undefined}
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
          name="address"
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
          style={color ? { color } : undefined}
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
          name="website"
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
          style={color ? { color } : undefined}
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
          name="linkedin"
          placeholder={t("placeholders.yourLinkedIn")}
          className="grow"
          value={data.linkedin}
          onChange={(e) => onChange("linkedin", e.target.value)}
        />
      </label>
    </fieldset>
  );

  // About Me is freely draggable between Modern's sidebar and main zones
  // too (not just sections), so its header restyles the same way sections'
  // do — reusing the shared SectionHeader instead of a fixed ternary.
  const aboutMeVariant: "main" | "minimal" | "sidebar" =
    templateId === "minimal"
      ? "minimal"
      : (templateId === "modern" || templateId === "elegant") &&
          sidebarItems.includes("aboutMe")
        ? "sidebar"
        : "main";

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      <SectionHeader
        icon={
          <AboutMeIcon
            className={
              aboutMeVariant === "sidebar"
                ? "h-5 w-5 shrink-0 stroke-current mr-2"
                : "h-6 w-6 shrink-0 stroke-current mr-2"
            }
          />
        }
        title={t("fields.aboutMe")}
        variant={aboutMeVariant}
        color={color}
      />
      <AutoResizeTextarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea textarea-plain w-full"
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

  if (templateId === "modern") {
    const sidebarFieldKeys = visibleFields.filter(
      (key) => !modernMainFieldKeys.includes(key),
    );

    return (
      <SortableZones
        dndId="modern-sections"
        zones={{ sidebar: sidebarItems, main: mainItems }}
        onChange={onZonesChange}
      >
        <div
          className="resume-scalable grid w-[280mm] min-h-[297mm] grid-cols-[90mm_1fr] bg-white shadow-xl print:shadow-none"
          style={{ fontFamily, ...fontSizeStyle }}
        >
          <div
            className="modern-sidebar bg-neutral text-neutral-content flex flex-col  p-6 pl-8"
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
            <div data-section-anchor="personalInfo">
              <SortableGroup
                dndId="modern-sidebar-fields"
                ids={sidebarFieldKeys}
                onReorder={(order) =>
                  onReorderFields([
                    ...order,
                    ...visibleFields.filter((key) =>
                      modernMainFieldKeys.includes(key),
                    ),
                  ])
                }
              >
                {sidebarFieldKeys.map((key) => (
                  <SortableBlock key={key} id={key}>
                    {fieldContent[key]}
                  </SortableBlock>
                ))}
              </SortableGroup>
            </div>

            <SortableZone
              zoneId="sidebar"
              ids={sidebarItems}
              className="flex min-h-8 flex-col"
            >
              {sidebarItems.map((item) => (
                <SortableBlock key={item} id={item} anchor>
                  {item === "aboutMe" ? fieldContent.aboutMe : sectionContent[item]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>

          <div className="p-6 pl-8">
            <SortableZone
              zoneId="main"
              ids={mainItems}
              className="flex min-h-8 flex-col"
            >
              {mainItems.map((item) => (
                <SortableBlock key={item} id={item} anchor>
                  {item === "aboutMe" ? fieldContent.aboutMe : sectionContent[item]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>
        </div>
      </SortableZones>
    );
  }

  if (templateId === "elegant") {
    const mainFieldKeys = visibleFields.filter(
      (key) => key !== "photo" && key !== "aboutMe",
    );

    return (
      <SortableZones
        dndId="elegant-sections"
        zones={{ sidebar: sidebarItems, main: mainItems }}
        onChange={onZonesChange}
      >
        <div
          className="resume-scalable grid w-[280mm] min-h-[297mm] grid-cols-[1fr_105mm] bg-white shadow-xl print:shadow-none"
          style={{ fontFamily, ...fontSizeStyle }}
        >
          <div className="p-6 pl-10">
            <div data-section-anchor="personalInfo">
              <SortableGroup
                dndId="elegant-main-fields"
                ids={mainFieldKeys}
                onReorder={(order) =>
                  onReorderFields([
                    ...visibleFields.filter((key) => key === "photo"),
                    ...order,
                    ...visibleFields.filter((key) => key === "aboutMe"),
                  ])
                }
              >
                <div className="flex flex-col">
                  {mainFieldKeys.map((key) => (
                    <SortableBlock key={key} id={key}>
                      {fieldContent[key]}
                    </SortableBlock>
                  ))}
                </div>
              </SortableGroup>
            </div>

            <SortableZone
              zoneId="main"
              ids={mainItems}
              className="flex min-h-8 flex-col"
            >
              {mainItems.map((item) => (
                <SortableBlock key={item} id={item} anchor>
                  {item === "aboutMe" ? fieldContent.aboutMe : sectionContent[item]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>

          <div
            className="modern-sidebar bg-neutral text-neutral-content flex flex-col p-6 pl-8"
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
            {avatar}

            <SortableZone
              zoneId="sidebar"
              ids={sidebarItems}
              className="flex min-h-8 flex-col"
            >
              {sidebarItems.map((item) => (
                <SortableBlock key={item} id={item} anchor>
                  {item === "aboutMe" ? fieldContent.aboutMe : sectionContent[item]}
                </SortableBlock>
              ))}
            </SortableZone>
          </div>
        </div>
      </SortableZones>
    );
  }

  if (templateId === "minimal") {
    return (
      <div
        className="resume-scalable w-[280mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
        style={{ fontFamily, ...fontSizeStyle }}
      >
        <div className="p-10 pl-12">
          <div data-section-anchor="personalInfo">
            <SortableGroup
              dndId="minimal-fields"
              ids={visibleFields}
              onReorder={onReorderFields}
              strategy={rectSortingStrategy}
            >
              <div className="flex flex-col">
                {renderFieldItems(visibleFields, fieldContent, {
                  wrapContactFields: true,
                })}
              </div>
            </SortableGroup>
          </div>

          <SortableGroup
            dndId="minimal-sections"
            ids={sectionOrder}
            onReorder={onReorderSections}
          >
            {sectionOrder.map((key) => (
              <SortableBlock key={key} id={key} anchor>
                {sectionContent[key]}
              </SortableBlock>
            ))}
          </SortableGroup>
        </div>
      </div>
    );
  }

  if (templateId === "classic") {
    const classicHeaderFieldKeys = visibleFields.filter(
      (key) => key !== "aboutMe",
    );
    const headerBgClass = color ? "" : "bg-neutral text-neutral-content";
    const headerStyle = color
      ? ({
          backgroundColor: color,
          color: getContrastTextColor(color),
          "--header-fg": getContrastTextColor(color),
        } as React.CSSProperties)
      : undefined;

    return (
      <div
        className="resume-scalable w-[280mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
        style={{ fontFamily, ...fontSizeStyle }}
      >
        <div
          data-section-anchor="personalInfo"
          className={`classic-header p-8 pl-10 ${headerBgClass}`}
          style={headerStyle}
        >
          <SortableGroup
            dndId="classic-fields"
            ids={classicHeaderFieldKeys}
            onReorder={(order) =>
              onReorderFields([
                ...order,
                ...visibleFields.filter((key) => key === "aboutMe"),
              ])
            }
          >
            <div className="flex flex-col">
              {renderFieldItems(classicHeaderFieldKeys, fieldContent)}
            </div>
          </SortableGroup>
        </div>

        <div className="p-8 pl-10">
          {fieldContent.aboutMe}

          <SortableGroup
            dndId="classic-sections"
            ids={sectionOrder}
            onReorder={onReorderSections}
          >
            {sectionOrder.map((key) => (
              <SortableBlock key={key} id={key} anchor>
                {sectionContent[key]}
              </SortableBlock>
            ))}
          </SortableGroup>
        </div>
      </div>
    );
  }

  return (
    <div
      className="resume-scalable w-[280mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div className="p-8 pl-10">
        <div data-section-anchor="personalInfo">
          <SortableGroup
            dndId="basic-fields"
            ids={visibleFields}
            onReorder={onReorderFields}
          >
            <div className="flex flex-col">
              {renderFieldItems(visibleFields, fieldContent)}
            </div>
          </SortableGroup>
        </div>

        <SortableGroup
          dndId="basic-sections"
          ids={sectionOrder}
          onReorder={onReorderSections}
        >
          {sectionOrder.map((key) => (
            <SortableBlock key={key} id={key} anchor>
              {sectionContent[key]}
            </SortableBlock>
          ))}
        </SortableGroup>
      </div>
    </div>
  );
}
