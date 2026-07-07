"use client";

import { Fragment } from "react";

export interface LanguageEntry {
  id: string;
  language: string;
  level: string;
}

export const languageLevels = [
  "Beginner",
  "Advanced",
  "Full Professional Proficiency",
  "Native Speaker",
];

export interface WorkEntry {
  id: string;
  position: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  jobDescription: string;
}

export interface EducationEntry {
  id: string;
  subject: string;
  location: string;
  description: string;
  dateFrom: string;
  dateTo: string;
}

export interface SimpleEntry {
  id: string;
  value: string;
}

export type SectionKey =
  | "workHistory"
  | "education"
  | "skills"
  | "languages"
  | "interests";

export const sectionLabels: Record<SectionKey, string> = {
  workHistory: "Work History",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  interests: "Interests",
};

export interface ResumeData {
  photo: string;
  title: string;
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  workHistory: WorkEntry[];
  education: EducationEntry[];
  skills: SimpleEntry[];
  languages: LanguageEntry[];
  interests: SimpleEntry[];
}

export const emptyResumeData: ResumeData = {
  photo: "",
  title: "",
  name: "",
  jobTitle: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  workHistory: [],
  education: [],
  skills: [],
  languages: [],
  interests: [],
};

interface ResumeProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onWorkHistoryChange: (workHistory: WorkEntry[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onSkillsChange: (skills: SimpleEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
  onInterestsChange: (interests: SimpleEntry[]) => void;
  sectionOrder: SectionKey[];
  onRemoveSection: (key: SectionKey) => void;
}

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
  onRemoveSection,
}: {
  icon: React.ReactNode;
  title: string;
  onRemoveSection: () => void;
}) {
  return (
    <div className="mt-4 mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {icon}
        {title}
      </h2>
      <button
        type="button"
        aria-label={`Remove ${title} section`}
        className="btn btn-square btn-ghost btn-xs"
        onClick={onRemoveSection}
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
            d="M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L5 7Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M10 11v6M14 11v6"
          />
        </svg>
      </button>
    </div>
  );
}

export default function Resume({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onLanguagesChange,
  onInterestsChange,
  sectionOrder,
  onRemoveSection,
}: ResumeProps) {
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

  function addWorkEntry() {
    onWorkHistoryChange([
      ...data.workHistory,
      {
        id: crypto.randomUUID(),
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
      data.workHistory.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeWorkEntry(id: string) {
    onWorkHistoryChange(data.workHistory.filter((entry) => entry.id !== id));
  }

  function addEducationEntry() {
    onEducationChange([
      ...data.education,
      {
        id: crypto.randomUUID(),
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

  function addSkill() {
    onSkillsChange([...data.skills, { id: crypto.randomUUID(), value: "" }]);
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

  function addLanguage() {
    onLanguagesChange([
      ...data.languages,
      { id: crypto.randomUUID(), language: "", level: languageLevels[0] },
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

  function addInterest() {
    onInterestsChange([
      ...data.interests,
      { id: crypto.randomUUID(), value: "" },
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

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workHistory: (
      <>
        <SectionHeader
          title={sectionLabels.workHistory}
          onRemoveSection={() => onRemoveSection("workHistory")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
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

        <div className="flex flex-col gap-4">
          {data.workHistory.map((entry) => (
            <div
              key={entry.id}
              className="border-base-300 flex flex-col gap-2 rounded-lg border p-4"
            >
              <div className="flex items-start gap-2">
                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="Your position"
                    className="input w-full"
                    value={entry.position}
                    onChange={(e) =>
                      updateWorkEntry(entry.id, "position", e.target.value)
                    }
                  />
                </fieldset>
                <RemoveButton
                  label="Remove work experience"
                  onClick={() => removeWorkEntry(entry.id)}
                />
              </div>

              <div className="flex gap-2">
                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="Start date (e.g. 01-06-2020)"
                    className="input w-full"
                    value={entry.dateFrom}
                    onChange={(e) =>
                      updateWorkEntry(entry.id, "dateFrom", e.target.value)
                    }
                  />
                </fieldset>

                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="End date or Present"
                    className="input w-full"
                    value={entry.dateTo}
                    onChange={(e) =>
                      updateWorkEntry(entry.id, "dateTo", e.target.value)
                    }
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder="Location"
                  className="input w-full"
                  value={entry.location}
                  onChange={(e) =>
                    updateWorkEntry(entry.id, "location", e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="fieldset">
                <textarea
                  placeholder="Describe your responsibilities and achievements..."
                  className="textarea w-full"
                  rows={4}
                  value={entry.jobDescription}
                  onChange={(e) =>
                    updateWorkEntry(
                      entry.id,
                      "jobDescription",
                      e.target.value,
                    )
                  }
                />
              </fieldset>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addWorkEntry}
          >
            + Add Work Experience
          </button>
        </div>
      </>
    ),

    education: (
      <>
        <SectionHeader
          title={sectionLabels.education}
          onRemoveSection={() => onRemoveSection("education")}
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
        />

        <div className="flex flex-col gap-4">
          {data.education.map((entry) => (
            <div
              key={entry.id}
              className="border-base-300 flex flex-col gap-2 rounded-lg border p-4"
            >
              <div className="flex items-start gap-2">
                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="Subject of study"
                    className="input w-full"
                    value={entry.subject}
                    onChange={(e) =>
                      updateEducationEntry(entry.id, "subject", e.target.value)
                    }
                  />
                </fieldset>
                <RemoveButton
                  label="Remove education"
                  onClick={() => removeEducationEntry(entry.id)}
                />
              </div>

              <div className="flex gap-2">
                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="Start date (e.g. 01-09-2016)"
                    className="input w-full"
                    value={entry.dateFrom}
                    onChange={(e) =>
                      updateEducationEntry(
                        entry.id,
                        "dateFrom",
                        e.target.value,
                      )
                    }
                  />
                </fieldset>

                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    placeholder="End date"
                    className="input w-full"
                    value={entry.dateTo}
                    onChange={(e) =>
                      updateEducationEntry(entry.id, "dateTo", e.target.value)
                    }
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder="Location"
                  className="input w-full"
                  value={entry.location}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, "location", e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="fieldset">
                <textarea
                  placeholder="Describe your studies, thesis, honors..."
                  className="textarea w-full"
                  rows={4}
                  value={entry.description}
                  onChange={(e) =>
                    updateEducationEntry(
                      entry.id,
                      "description",
                      e.target.value,
                    )
                  }
                />
              </fieldset>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addEducationEntry}
          >
            + Add Education
          </button>
        </div>
      </>
    ),

    skills: (
      <>
        <SectionHeader
          title={sectionLabels.skills}
          onRemoveSection={() => onRemoveSection("skills")}
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
                d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          {data.skills.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
                <input
                  type="text"
                  placeholder="Your skill"
                  className="input w-full"
                  value={entry.value}
                  onChange={(e) => updateSkill(entry.id, e.target.value)}
                />
              </fieldset>
              <RemoveButton
                label="Remove skill"
                onClick={() => removeSkill(entry.id)}
              />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addSkill}
          >
            + Add Skill
          </button>
        </div>
      </>
    ),

    languages: (
      <>
        <SectionHeader
          title={sectionLabels.languages}
          onRemoveSection={() => onRemoveSection("languages")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
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

        <div className="flex flex-col gap-2">
          {data.languages.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
                <input
                  type="text"
                  placeholder="Your language"
                  className="input w-full"
                  value={entry.language}
                  onChange={(e) =>
                    updateLanguage(entry.id, "language", e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="fieldset">
                <div
                  className="flex items-center gap-2"
                  aria-label="Language proficiency level"
                >
                  <div className="rating">
                    {languageLevels.map((level) => (
                      <input
                        key={level}
                        type="radio"
                        name={`language-level-${entry.id}`}
                        aria-label={level}
                        className="mask mask-star"
                        checked={entry.level === level}
                        onChange={() =>
                          updateLanguage(entry.id, "level", level)
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs whitespace-nowrap text-gray-500">
                    {entry.level}
                  </span>
                </div>
              </fieldset>

              <RemoveButton
                label="Remove language"
                onClick={() => removeLanguage(entry.id)}
              />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addLanguage}
          >
            + Add Language
          </button>
        </div>
      </>
    ),

    interests: (
      <>
        <SectionHeader
          title={sectionLabels.interests}
          onRemoveSection={() => onRemoveSection("interests")}
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
        />

        <div className="flex flex-col gap-2">
          {data.interests.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
                <input
                  type="text"
                  placeholder="Your interest"
                  className="input w-full"
                  value={entry.value}
                  onChange={(e) => updateInterest(entry.id, e.target.value)}
                />
              </fieldset>
              <RemoveButton
                label="Remove interest"
                onClick={() => removeInterest(entry.id)}
              />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addInterest}
          >
            + Add Interest
          </button>
        </div>
      </>
    ),
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none">
      <div className="p-8">
        <div className="grid grid-cols-2 gap-x-4">
          <div className="col-span-2 flex gap-6">
            <label
              className="avatar avatar-placeholder cursor-pointer items-center justify-center"
              aria-label="Upload profile photo"
            >
              <div className="bg-neutral text-neutral-content h-50 rounded-full">
                {data.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset
                  <img
                    src={data.photo}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-1/2 w-1/2 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 16.5V4.5m0 0-4 4m4-4 4 4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"
                    />
                  </svg>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>

            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="flex items-end gap-2">
                <fieldset className="fieldset w-24">
                  <input
                    type="text"
                    name="title"
                    placeholder="Your title"
                    className="input w-full"
                    value={data.title}
                    onChange={(e) => onChange("title", e.target.value)}
                  />
                </fieldset>

                <fieldset className="fieldset flex-1">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    className="input w-full"
                    value={data.name}
                    onChange={(e) => onChange("name", e.target.value)}
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <input
                  type="text"
                  name="jobTitle"
                  placeholder="Your job title"
                  className="input w-full"
                  value={data.jobTitle}
                  onChange={(e) => onChange("jobTitle", e.target.value)}
                />
              </fieldset>
            </div>
          </div>

          <fieldset className="fieldset">
            <input
              type="tel"
              name="phone"
              placeholder="Your phone"
              className="input w-full"
              value={data.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <input
              type="email"
              name="email"
              placeholder="Your email"
              className="input w-full"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset col-span-2">
            <input
              type="text"
              name="address"
              placeholder="Your address"
              className="input w-full"
              value={data.address}
              onChange={(e) => onChange("address", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset col-span-2">
            <input
              type="text"
              name="website"
              placeholder="Your website"
              className="input w-full"
              value={data.website}
              onChange={(e) => onChange("website", e.target.value)}
            />
          </fieldset>
        </div>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
