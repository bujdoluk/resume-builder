"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import AiRewriteButton from "@/components/ai-tools/AiRewriteButton";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import type { MobileTemplateProps } from "@/components/resumes/mobile-templates/BasicMobileTemplate";
import {
  reorderEntries,
  SortableBlock,
  SortableGroup,
} from "@/components/Sortable";
import {
  createHarvardFormHandlers,
  createResumeFormHandlers,
} from "@/components/resumes/useResumeFormHandlers";
import { type FieldKey } from "@/lib/fields";
import { formatPhoneAsYouType } from "@/lib/phone";
import {
  languageLevelKey,
  languageLevels,
  type EducationEntry,
  type HonorAwardEntry,
  type SectionKey,
  type WorkEntry,
} from "@/lib/resumeData";
import type {
  EducationEntryFieldKey,
  HonorAwardEntryFieldKey,
  WorkEntryFieldKey,
} from "@/types/resume";

const defaultWorkFieldOrder: WorkEntryFieldKey[] = [
  "position",
  "dateFrom",
  "dateTo",
  "location",
  "jobDescription",
];

const defaultEducationFieldOrder: EducationEntryFieldKey[] = [
  "subject",
  "school",
  "dateFrom",
  "dateTo",
  "location",
  "description",
];

const defaultHonorAwardFieldOrder: HonorAwardEntryFieldKey[] = [
  "name",
  "issuer",
  "dateFrom",
  "dateTo",
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

function SectionHeader({
  title,
  onTitleChange,
  titlePlaceholder,
}: {
  title: string;
  onTitleChange?: (value: string) => void;
  titlePlaceholder?: string;
}) {
  return (
    <div className="mt-6 mb-3 border-b border-black pb-1">
      <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
        {onTitleChange ? (
          <input
            type="text"
            className="w-full border-none bg-transparent p-0 text-sm font-bold tracking-[0.2em] uppercase outline-none focus:outline-none"
            value={title}
            placeholder={titlePlaceholder}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        ) : (
          title
        )}
      </h2>
    </div>
  );
}

// Harvard's style is locked: no color, no icons, no photo, fixed serif font
// — see HarvardTemplate.tsx (the read-only desktop counterpart) for the
// same rules applied to the print/preview output.
export default function HarvardMobileTemplate({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onCertificationsChange,
  onLanguagesChange,
  onInterestsChange,
  onLeadershipChange,
  onHonorsChange,
  sectionOrder,
  onReorderSections,
  visibleFields,
  onReorderFields,
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
  const harvardHandlers = createHarvardFormHandlers({
    data,
    onLeadershipChange: onLeadershipChange ?? (() => {}),
    onHonorsChange: onHonorsChange ?? (() => {}),
  });
  const [workFieldOrder, setWorkFieldOrder] = useState(defaultWorkFieldOrder);
  const [educationFieldOrder, setEducationFieldOrder] = useState(
    defaultEducationFieldOrder,
  );
  const [leadershipFieldOrder, setLeadershipFieldOrder] = useState(defaultWorkFieldOrder);
  const [honorAwardFieldOrder, setHonorAwardFieldOrder] = useState(
    defaultHonorAwardFieldOrder,
  );

  function workEntryFields(
    entry: WorkEntry,
    update: (id: string, field: Exclude<keyof WorkEntry, "id">, value: string) => void,
  ): Record<WorkEntryFieldKey, React.ReactNode> {
    return {
      position: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.yourPosition")}
            className="input input-plain w-full"
            value={entry.position}
            onChange={(e) => update(entry.id, "position", e.target.value)}
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
            onChange={(e) => update(entry.id, "dateFrom", e.target.value)}
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
            onChange={(e) => update(entry.id, "dateTo", e.target.value)}
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
            onChange={(e) => update(entry.id, "location", e.target.value)}
          />
        </fieldset>
      ),
      jobDescription: (
        <fieldset className="fieldset">
          <div className="flex justify-end">
            <AiRewriteButton
              text={entry.jobDescription}
              style="bullets"
              onRewrite={(newText) => update(entry.id, "jobDescription", newText)}
            />
          </div>
          <AutoResizeTextarea
            placeholder={t("placeholders.describeResponsibilities")}
            className="textarea input-plain w-full"
            value={entry.jobDescription}
            onChange={(e) => update(entry.id, "jobDescription", e.target.value)}
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
          <div className="flex justify-end">
            <AiRewriteButton
              text={entry.description}
              style="bullets"
              onRewrite={(newText) =>
                handlers.updateEducationEntry(entry.id, "description", newText)
              }
            />
          </div>
          <AutoResizeTextarea
            placeholder={t("placeholders.describeStudies")}
            className="textarea input-plain w-full"
            value={entry.description}
            onChange={(e) =>
              handlers.updateEducationEntry(entry.id, "description", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function honorAwardFields(
    entry: HonorAwardEntry,
  ): Record<HonorAwardEntryFieldKey, React.ReactNode> {
    return {
      name: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.honorAwardName")}
            className="input w-full"
            value={entry.name}
            onChange={(e) =>
              harvardHandlers.updateHonorAward(entry.id, "name", e.target.value)
            }
          />
        </fieldset>
      ),
      issuer: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.honorAwardIssuer")}
            className="input w-full"
            value={entry.issuer}
            onChange={(e) =>
              harvardHandlers.updateHonorAward(entry.id, "issuer", e.target.value)
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
              harvardHandlers.updateHonorAward(entry.id, "dateFrom", e.target.value)
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
              harvardHandlers.updateHonorAward(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  const name = !visibleFields.includes("name") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        placeholder={t("placeholders.yourName")}
        className="input input-plain w-full text-center text-3xl font-bold tracking-wide uppercase"
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
        className="input input-plain w-full text-center text-sm"
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
        className="input input-plain w-full text-center text-sm"
        value={data.phone}
        onChange={(e) => onChange("phone", formatPhoneAsYouType(e.target.value))}
      />
    </fieldset>
  );

  const email = !visibleFields.includes("email") ? null : (
    <fieldset className="fieldset">
      <input
        type="email"
        placeholder={t("placeholders.yourEmail")}
        className="input input-plain w-full text-center text-sm"
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
        className="input input-plain w-full text-center text-sm"
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
        className="input input-plain w-full text-center text-sm"
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
        className="input input-plain w-full text-center text-sm"
        value={data.linkedin}
        onChange={(e) => onChange("linkedin", e.target.value)}
      />
    </fieldset>
  );

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      <div className="mt-6 mb-3 border-b border-black pb-1">
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
          {t("fields.aboutMe")}
        </h2>
      </div>
      <AutoResizeTextarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea input-plain w-full"
        value={data.aboutMe}
        onChange={(e) => onChange("aboutMe", e.target.value)}
      />
    </div>
  );

  // Photo is force-hidden regardless of visibleFields — see HarvardTemplate.
  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name,
    jobTitle,
    phone,
    email,
    address,
    website,
    linkedin,
    aboutMe,
  };
  const harvardFieldOrder = visibleFields.filter((key) => key !== "photo");

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionHeader title={t("sections.workExperience")} />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="harvard-work-history-entries"
            ids={data.workExperience.map((entry) => entry.id)}
            onReorder={(order) =>
              onWorkHistoryChange(reorderEntries(data.workExperience, order))
            }
          >
            {data.workExperience.map((entry) => {
              const fields = workEntryFields(entry, handlers.updateWorkEntry);
              return (
                <SortableBlock key={entry.id} id={entry.id} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeWorkExperience")}
                      onClick={() => handlers.removeWorkEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`harvard-work-fields-${entry.id}`}
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
        <SectionHeader title={t("sections.education")} />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="harvard-education-entries"
            ids={data.education.map((entry) => entry.id)}
            onReorder={(order) =>
              onEducationChange(reorderEntries(data.education, order))
            }
          >
            {data.education.map((entry) => {
              const fields = educationEntryFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeEducation")}
                      onClick={() => handlers.removeEducationEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`harvard-education-fields-${entry.id}`}
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
        <SectionHeader title={t("sections.skills")} />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="harvard-skills-entries"
            ids={data.skills.map((entry) => entry.id)}
            onReorder={(order) => onSkillsChange(reorderEntries(data.skills, order))}
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
        <SectionHeader title={t("sections.certifications")} />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="harvard-certifications-entries"
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
        <SectionHeader title={t("sections.languages")} />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="harvard-languages-entries"
            ids={data.languages.map((entry) => entry.id)}
            onReorder={(order) => onLanguagesChange(reorderEntries(data.languages, order))}
          >
            {data.languages.map((entry) => {
              const levelIndex = languageLevels.indexOf(entry.level);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex items-center gap-2">
                    <fieldset className="fieldset min-w-0 flex-1">
                      <input
                        type="text"
                        placeholder={t("placeholders.yourLanguage")}
                        className="input w-full"
                        value={entry.language}
                        onChange={(e) =>
                          handlers.updateLanguage(entry.id, "language", e.target.value)
                        }
                      />
                    </fieldset>
                    <div
                      className="flex shrink-0 items-center gap-2"
                      aria-label="Language proficiency level"
                    >
                      <span className="shrink-0 text-xs whitespace-nowrap">
                        {t(languageLevelKey(entry.level))}
                      </span>
                      <div className="rating shrink-0 pl-2">
                        {languageLevels.map((level, index) => (
                          <input
                            key={level}
                            type="radio"
                            name={`harvard-mobile-language-level-${entry.id}`}
                            aria-label={t(languageLevelKey(level))}
                            className="mask mask-star"
                            checked={index === levelIndex}
                            onChange={() => handlers.updateLanguage(entry.id, "level", level)}
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
        <SectionHeader title={t("sections.interests")} />
        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="harvard-interests-entries"
            ids={data.interests.map((entry) => entry.id)}
            onReorder={(order) => onInterestsChange(reorderEntries(data.interests, order))}
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

    customFields: (
      <>
        <SectionHeader
          title={data.customFieldsTitle}
          onTitleChange={(value) => onChange("customFieldsTitle", value)}
          titlePlaceholder={t("sections.customFields")}
        />
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.customFieldValue")}
            className="input w-full"
            value={data.customFieldValue}
            onChange={(e) => onChange("customFieldValue", e.target.value)}
          />
        </fieldset>
      </>
    ),
  };

  return (
    <div
      className="resume-scalable flex flex-col gap-4 bg-white pl-8 text-black"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div data-section-anchor="personalInfo">
        <SortableGroup
          dndId="harvard-mobile-fields"
          ids={harvardFieldOrder}
          onReorder={onReorderFields}
        >
          <div className="flex flex-col gap-4">
            {harvardFieldOrder.map((key) => (
              <SortableBlock key={key} id={key}>
                {fieldContent[key]}
              </SortableBlock>
            ))}
          </div>
        </SortableGroup>
      </div>

      <SortableGroup
        dndId="harvard-mobile-sections"
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

      <div className="flex flex-col gap-2">
        <SectionHeader title={t("sections.leadershipExperience")} />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="harvard-leadership-entries"
            ids={data.leadershipExperience.map((entry) => entry.id)}
            onReorder={(order) =>
              (onLeadershipChange ?? (() => {}))(
                reorderEntries(data.leadershipExperience, order),
              )
            }
          >
            {data.leadershipExperience.map((entry) => {
              const fields = workEntryFields(entry, harvardHandlers.updateLeadershipEntry);
              return (
                <SortableBlock key={entry.id} id={entry.id} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeLeadershipExperience")}
                      onClick={() => harvardHandlers.removeLeadershipEntry(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`harvard-leadership-fields-${entry.id}`}
                    ids={leadershipFieldOrder}
                    onReorder={setLeadershipFieldOrder}
                  >
                    {leadershipFieldOrder.map((key) => (
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
            onClick={harvardHandlers.addLeadershipEntry}
          >
            {t("buttons.addLeadershipExperience")}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title={t("sections.honorsAwards")} />
        <div className="flex flex-col gap-4">
          <SortableGroup
            dndId="harvard-honors-entries"
            ids={data.honorsAwards.map((entry) => entry.id)}
            onReorder={(order) =>
              (onHonorsChange ?? (() => {}))(reorderEntries(data.honorsAwards, order))
            }
          >
            {data.honorsAwards.map((entry) => {
              const fields = honorAwardFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <RemoveButton
                      label={t("aria.removeHonorAward")}
                      onClick={() => harvardHandlers.removeHonorAward(entry.id)}
                    />
                  </div>
                  <SortableGroup
                    dndId={`harvard-honors-fields-${entry.id}`}
                    ids={honorAwardFieldOrder}
                    onReorder={setHonorAwardFieldOrder}
                  >
                    {honorAwardFieldOrder.map((key) => (
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
            onClick={harvardHandlers.addHonorAward}
          >
            {t("buttons.addHonorAward")}
          </button>
        </div>
      </div>
    </div>
  );
}
