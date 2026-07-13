"use client";

/**
 * Mobile-width editing form for the Minimal template: icon-free, centered
 * layout with bordered section-header dividers and left-accented entry
 * cards, sharing the same drag-and-drop primitives and CRUD handlers as the
 * desktop `Resume.tsx` canvas.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MobileTemplateProps } from "@/components/mobile-templates/BasicMobileTemplate";
import {
  reorderEntries,
  SortableBlock,
  SortableGroup,
} from "@/components/Sortable";
import { createResumeFormHandlers } from "@/components/useResumeFormHandlers";
import { getContrastTextColor } from "@/lib/color";
import { type FieldKey } from "@/lib/fields";
import {
  languageLevels,
  type EducationEntry,
  type SectionKey,
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

// No icons anywhere in Minimal — headers get a bottom border/divider instead,
// driven by the accent colour, with wide letter-spacing.
function SectionHeader({ title, color }: { title: string; color?: string | null }) {
  return (
    <div
      className="border-primary mt-6 mb-3 border-b-2 pb-1"
      style={color ? { borderColor: color } : undefined}
    >
      <h2 className="text-sm font-bold tracking-[0.2em] uppercase">{title}</h2>
    </div>
  );
}

export default function MinimalMobileTemplate({
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
        className="input input-plain w-full text-center text-3xl font-bold tracking-wide"
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
        className="input input-plain text-primary w-full text-center text-sm font-semibold tracking-[0.15em] uppercase"
        style={color ? { color } : undefined}
        value={data.jobTitle}
        onChange={(e) => onChange("jobTitle", e.target.value)}
      />
    </fieldset>
  );

  const phone = !visibleFields.includes("phone") ? null : (
    <fieldset className="fieldset">
      <input
        type="tel"
        placeholder={t("placeholders.yourPhone")}
        className="input input-plain w-full text-center"
        value={data.phone}
        onChange={(e) => onChange("phone", e.target.value)}
      />
    </fieldset>
  );

  const email = !visibleFields.includes("email") ? null : (
    <fieldset className="fieldset">
      <input
        type="email"
        placeholder={t("placeholders.yourEmail")}
        className="input input-plain w-full text-center"
        value={data.email}
        onChange={(e) => onChange("email", e.target.value)}
      />
    </fieldset>
  );

  const address = !visibleFields.includes("address") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourAddress")}
        className="input input-plain w-full text-center"
        value={data.address}
        onChange={(e) => onChange("address", e.target.value)}
      />
    </fieldset>
  );

  const website = !visibleFields.includes("website") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourWebsite")}
        className="input input-plain w-full text-center"
        value={data.website}
        onChange={(e) => onChange("website", e.target.value)}
      />
    </fieldset>
  );

  const linkedin = !visibleFields.includes("linkedin") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourLinkedIn")}
        className="input input-plain w-full text-center"
        value={data.linkedin}
        onChange={(e) => onChange("linkedin", e.target.value)}
      />
    </fieldset>
  );

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      <div
        className="border-primary mt-6 mb-3 border-b-2 pb-1"
        style={color ? { borderColor: color } : undefined}
      >
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
          {t("fields.aboutMe")}
        </h2>
      </div>
      <textarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea input-plain w-full"
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

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionHeader title={t("sections.workExperience")} color={color} />
        <div className="flex flex-col gap-4">
          {data.workExperience.map((entry) => {
            const fields = workEntryFields(entry);
            return (
              <div
                key={entry.id}
                className="border-primary/40 flex flex-col gap-2 border-l-2 pl-3"
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
              </div>
            );
          })}
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
        <SectionHeader title={t("sections.education")} color={color} />
        <div className="flex flex-col gap-4">
          {data.education.map((entry) => {
            const fields = educationEntryFields(entry);
            return (
              <div
                key={entry.id}
                className="border-primary/40 flex flex-col gap-2 border-l-2 pl-3"
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
              </div>
            );
          })}
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
        <SectionHeader title={t("sections.skills")} color={color} />
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
        <SectionHeader title={t("sections.certifications")} color={color} />
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
                      className="input w-full"
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
                      className="input w-full"
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
    ),

    languages: (
      <>
        <SectionHeader title={t("sections.languages")} color={color} />
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
                  <div className="border-primary/40 flex flex-col gap-2 border-l-2 pl-3">
                    <div className="flex items-end gap-2">
                      <fieldset className="fieldset flex-1">
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
                      <RemoveButton
                        label={t("aria.removeLanguage")}
                        onClick={() => handlers.removeLanguage(entry.id)}
                      />
                    </div>
                    <div
                      className="flex items-center gap-2"
                      aria-label="Language proficiency level"
                    >
                      <span className="w-[152px] shrink-0 text-xs whitespace-nowrap text-gray-500">
                        {entry.level}
                      </span>
                      <div className="rating shrink-0 pl-2">
                        {languageLevels.map((level, index) => (
                          <input
                            key={level}
                            type="radio"
                            name={`minimal-mobile-language-level-${entry.id}`}
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
    ),

    interests: (
      <>
        <SectionHeader title={t("sections.interests")} color={color} />
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
    <div className="flex flex-col gap-4 pl-8">
      <div data-section-anchor="personalInfo">
        <SortableGroup
          dndId="minimal-mobile-fields"
          ids={visibleFields}
          onReorder={onReorderFields}
        >
          <div className="flex flex-col gap-4">
            {visibleFields.map((key) => (
              <SortableBlock key={key} id={key}>
                {fieldContent[key]}
              </SortableBlock>
            ))}
          </div>
        </SortableGroup>
      </div>

      <SortableGroup
        dndId="minimal-mobile-sections"
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
