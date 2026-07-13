"use client";

/**
 * Mobile-width editing form for the Modern template: mirrors Modern's dark
 * accent-colored block (photo/contact/skills/certifications/languages)
 * stacked above the main content area, sharing the same drag-and-drop
 * primitives and CRUD handlers as the desktop `Resume.tsx` canvas.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MobileTemplateProps } from "@/components/mobile-templates/BasicMobileTemplate";
import { AboutMeIcon } from "@/components/Icons";
import {
  reorderEntries,
  SortableBlock,
  SortableGroup,
  SortableZone,
  SortableZones,
} from "@/components/Sortable";
import { createResumeFormHandlers } from "@/components/useResumeFormHandlers";
import { useModernZoneLayout } from "@/components/useModernZoneLayout";
import { getContrastTextColor } from "@/lib/color";
import { type FieldKey } from "@/lib/fields";
import {
  languageLevels,
  type EducationEntry,
  type SectionKey,
  type WorkEntry,
} from "@/lib/resumeData";

const mainFieldKeys: FieldKey[] = ["aboutMe"];

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

// Sidebar-zone headers drop the accent-color text (the block already
// carries its own contrast colour) in favor of a muted opacity-70 look — a
// section keeps whichever style matches the zone it's currently placed in,
// so dragging it between zones restyles its header.
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
      <div className="mt-4 mb-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
          {icon}
          {title}
        </h2>
      </div>
    );
  }
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

export default function ModernMobileTemplate({
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
  modernSectionZones,
  onChangeModernSectionZones,
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
  const { sidebarItems, mainItems, onZonesChange } = useModernZoneLayout({
    sectionOrder,
    onReorderSections,
    modernSectionZones,
    setModernSectionZones: onChangeModernSectionZones,
    visibleFields,
  });

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
          <textarea
            placeholder={t("placeholders.describeResponsibilities")}
            className="textarea input-plain w-full"
            rows={4}
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
          <textarea
            placeholder={t("placeholders.describeStudies")}
            className="textarea input-plain w-full"
            rows={4}
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
    <div className="flex justify-center">
      <label
        className="avatar avatar-placeholder relative w-fit cursor-pointer"
        aria-label={t("aria.uploadProfilePhoto")}
      >
        <div className="bg-white text-neutral h-24 w-24 rounded-full">
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
            className="btn btn-circle btn-neutral btn-xs absolute top-0 right-0"
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
    </div>
  );

  const name = !visibleFields.includes("name") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourName")}
        className="input input-plain w-full text-center text-xl font-bold"
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
        className="input input-plain w-full text-center text-sm opacity-80"
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
          className="h-5 w-5 shrink-0 stroke-current text-gray-500"
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
          className="grow text-sm"
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
          className="h-5 w-5 shrink-0 stroke-current text-gray-500"
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
          className="grow text-sm"
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
          className="h-5 w-5 shrink-0 stroke-current text-gray-500"
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
          className="grow text-sm"
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
          className="h-5 w-5 shrink-0 stroke-current text-gray-500"
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
          className="grow text-sm"
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
          className="h-5 w-5 shrink-0 stroke-current text-gray-500"
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
          className="grow text-sm"
          value={data.linkedin}
          onChange={(e) => onChange("linkedin", e.target.value)}
        />
      </label>
    </fieldset>
  );

  // About Me is freely draggable between the sidebar and main zones too
  // (not just sections), so its header restyles the same way sections' do.
  const aboutMeZone: "main" | "sidebar" = sidebarItems.includes("aboutMe")
    ? "sidebar"
    : "main";

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      <SectionHeader
        icon={
          <AboutMeIcon
            className={
              aboutMeZone === "sidebar"
                ? "h-5 w-5 shrink-0 stroke-current"
                : "h-6 w-6 shrink-0 stroke-current"
            }
          />
        }
        title={t("fields.aboutMe")}
        zone={aboutMeZone}
        color={color}
      />
      <textarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea textarea-plain w-full"
        rows={3}
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

  // Renders one section's editing UI for either zone — the fields
  // themselves stay fully editable in both (this is a form, not a display
  // template), only the header restyles to match Modern's sidebar
  // (opacity-70, no accent color) vs. main (accent-colored) look.
  function renderSection(
    key: SectionKey,
    zone: "main" | "sidebar",
  ): React.ReactNode {
    const headerColor = zone === "sidebar" ? undefined : color;

    switch (key) {
      case "workExperience":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 stroke-current"
                >
                  <rect x="3" y="7.5" width="18" height="12" rx="1.5" strokeWidth="1.5" />
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
              title={t("sections.workExperience")}
              zone={zone}
              color={headerColor}
            />
            <div className="flex flex-col gap-4">
              <SortableGroup
                dndId="work-history-entries"
                ids={data.workExperience.map((entry) => entry.id)}
                onReorder={(order) =>
                  onWorkHistoryChange(
                    reorderEntries(data.workExperience, order),
                  )
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
                        {workFieldOrder.map((fieldKey) => (
                          <SortableBlock key={fieldKey} id={fieldKey}>
                            {fields[fieldKey]}
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
        );

      case "education":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 stroke-current"
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
              title={t("sections.education")}
              zone={zone}
              color={headerColor}
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
                        {educationFieldOrder.map((fieldKey) => (
                          <SortableBlock key={fieldKey} id={fieldKey}>
                            {fields[fieldKey]}
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
        );

      case "skills":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
                  />
                </svg>
              }
              title={t("sections.skills")}
              zone={zone}
              color={headerColor}
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
                          className="input w-full text-sm"
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
        );

      case "certifications":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 stroke-current"
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
              title={t("sections.certifications")}
              zone={zone}
              color={headerColor}
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
                    <div className="flex items-end gap-2">
                      <fieldset className="fieldset flex-1">
                        <input
                          type="text"
                          placeholder={t("placeholders.certificationName")}
                          className="input w-full text-sm"
                          value={entry.name}
                          onChange={(e) =>
                            handlers.updateCertification(entry.id, "name", e.target.value)
                          }
                        />
                      </fieldset>
                      <fieldset className="fieldset flex-1">
                        <input
                          type="text"
                          placeholder={t("placeholders.date")}
                          className="input w-full text-sm"
                          value={entry.date}
                          onChange={(e) =>
                            handlers.updateCertification(entry.id, "date", e.target.value)
                          }
                        />
                      </fieldset>
                      <RemoveButton
                        label={t("aria.removeCertification")}
                        onClick={() => handlers.removeCertification(entry.id)}
                      />
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
        );

      case "languages":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 stroke-current"
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
              title={t("sections.languages")}
              zone={zone}
              color={headerColor}
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
                      <div className="flex flex-col gap-2 rounded-lg p-4">
                        <div className="flex items-end gap-2">
                          <fieldset className="fieldset flex-1">
                            <input
                              type="text"
                              placeholder={t("placeholders.yourLanguage")}
                              className="input w-full text-sm"
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
                          <RemoveButton
                            label={t("aria.removeLanguage")}
                            onClick={() => handlers.removeLanguage(entry.id)}
                          />
                        </div>
                        <div
                          className="flex items-center gap-2"
                          aria-label="Language proficiency level"
                        >
                          <span className="w-[152px] shrink-0 text-xs whitespace-nowrap opacity-70">
                            {entry.level}
                          </span>
                          <div className="rating shrink-0 pl-2">
                            {languageLevels.map((level, index) => (
                              <input
                                key={level}
                                type="radio"
                                name={`modern-mobile-language-level-${entry.id}`}
                                aria-label={level}
                                className="mask mask-star"
                                checked={index === levelIndex}
                                onChange={() =>
                                  handlers.updateLanguage(entry.id, "level", level)
                                }
                              />
                            ))}
                          </div>
                        </div>
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
        );

      case "interests":
        return (
          <>
            <SectionHeader
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 20.25c-.318 0-.633-.088-.906-.262C7.499 17.577 3 14.15 3 9.75 3 7.026 5.132 4.9 7.79 4.9c1.6 0 3.049.789 3.96 2.017a.7.7 0 0 0 .5.208.7.7 0 0 0 .5-.208A4.897 4.897 0 0 1 16.71 4.9C19.368 4.9 21.5 7.026 21.5 9.75c0 4.4-4.5 7.827-8.594 10.238-.273.174-.588.262-.906.262Z"
                  />
                </svg>
              }
              title={t("sections.interests")}
              zone={zone}
              color={headerColor}
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
        );
    }
  }

  const sidebarFieldKeys = visibleFields.filter(
    (key) => !mainFieldKeys.includes(key),
  );

  return (
    <SortableZones
      dndId="modern-mobile-sections"
      zones={{ sidebar: sidebarItems, main: mainItems }}
      onChange={onZonesChange}
    >
      <div className="flex flex-col gap-4 pl-8">
        <div
          className="modern-sidebar bg-neutral text-neutral-content flex flex-col gap-2 rounded-lg p-4"
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
              dndId="modern-mobile-sidebar-fields"
              ids={sidebarFieldKeys}
              onReorder={(order) =>
                onReorderFields([
                  ...order,
                  ...visibleFields.filter((key) => mainFieldKeys.includes(key)),
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
            className="flex min-h-8 flex-col gap-2"
          >
            {sidebarItems.map((item) => (
              <SortableBlock key={item} id={item} anchor>
                {item === "aboutMe"
                  ? fieldContent.aboutMe
                  : renderSection(item, "sidebar")}
              </SortableBlock>
            ))}
          </SortableZone>
        </div>

        <SortableZone
          zoneId="main"
          ids={mainItems}
          className="flex min-h-8 flex-col gap-2"
        >
          {mainItems.map((item) => (
            <SortableBlock key={item} id={item} anchor>
              {item === "aboutMe"
                ? fieldContent.aboutMe
                : renderSection(item, "main")}
            </SortableBlock>
          ))}
        </SortableZone>
      </div>
    </SortableZones>
  );
}
