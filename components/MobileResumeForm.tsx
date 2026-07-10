"use client";

import { useTranslation } from "react-i18next";
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
import { type FieldKey } from "@/lib/fields";
import {
  languageLevels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";

interface MobileResumeFormProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onWorkHistoryChange: (workExperience: WorkEntry[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onSkillsChange: (skills: SimpleEntry[]) => void;
  onCertificationsChange: (certifications: CertificationEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
  onInterestsChange: (interests: SimpleEntry[]) => void;
  sectionOrder: SectionKey[];
  visibleFields: FieldKey[];
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

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mt-4 mb-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {icon}
        {title}
      </h2>
    </div>
  );
}

export default function MobileResumeForm({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onCertificationsChange,
  onLanguagesChange,
  onInterestsChange,
  sectionOrder,
  visibleFields,
}: MobileResumeFormProps) {
  const { t } = useTranslation();

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
      ...data.workExperience,
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
      data.workExperience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeWorkEntry(id: string) {
    onWorkHistoryChange(data.workExperience.filter((entry) => entry.id !== id));
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

  function addCertification() {
    onCertificationsChange([
      ...data.certifications,
      { id: crypto.randomUUID(), name: "", date: "" },
    ]);
  }

  function updateCertification(
    id: string,
    field: "name" | "date",
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

  function addLanguage() {
    onLanguagesChange([
      ...data.languages,
      { id: crypto.randomUUID(), language: "", level: languageLevels[0] },
    ]);
  }

  function updateLanguage(id: string, field: "language" | "level", value: string) {
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
    onInterestsChange([...data.interests, { id: crypto.randomUUID(), value: "" }]);
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

  const isVisible = (key: FieldKey) => visibleFields.includes(key);

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: (
      <label
        className="avatar avatar-placeholder w-fit cursor-pointer self-center"
        aria-label={t("aria.uploadProfilePhoto")}
      >
        <div className="bg-neutral text-neutral-content h-32 w-32 rounded-full">
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
              <span className="text-xs font-medium">
                {t("placeholders.uploadPhoto")}
              </span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </label>
    ),
    name: (
      <fieldset className="fieldset">
        <input
          type="text"
          placeholder={t("placeholders.yourName")}
          className="input w-full"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </fieldset>
    ),
    jobTitle: (
      <fieldset className="fieldset">
        <input
          type="text"
          placeholder={t("placeholders.yourJobTitle")}
          className="input w-full"
          value={data.jobTitle}
          onChange={(e) => onChange("jobTitle", e.target.value)}
        />
      </fieldset>
    ),
    phone: (
      <fieldset className="fieldset">
        <label className="input w-full">
          <PhoneIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <input
            type="tel"
            placeholder={t("placeholders.yourPhone")}
            className="grow"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </label>
      </fieldset>
    ),
    email: (
      <fieldset className="fieldset">
        <label className="input w-full">
          <EmailIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <input
            type="email"
            placeholder={t("placeholders.yourEmail")}
            className="grow"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </label>
      </fieldset>
    ),
    address: (
      <fieldset className="fieldset">
        <label className="input w-full">
          <AddressIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <input
            type="text"
            placeholder={t("placeholders.yourAddress")}
            className="grow"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </label>
      </fieldset>
    ),
    website: (
      <fieldset className="fieldset">
        <label className="input w-full">
          <WebsiteIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <input
            type="text"
            placeholder={t("placeholders.yourWebsite")}
            className="grow"
            value={data.website}
            onChange={(e) => onChange("website", e.target.value)}
          />
        </label>
      </fieldset>
    ),
    linkedin: (
      <fieldset className="fieldset">
        <label className="input w-full">
          <LinkedInIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <input
            type="text"
            placeholder={t("placeholders.yourLinkedIn")}
            className="grow"
            value={data.linkedin}
            onChange={(e) => onChange("linkedin", e.target.value)}
          />
        </label>
      </fieldset>
    ),
    aboutMe: (
      <div>
        <div className="mt-4 mb-2 flex items-center gap-2">
          <AboutMeIcon className="h-6 w-6 shrink-0 stroke-current text-gray-500" />
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            {t("fields.aboutMe")}
          </h2>
        </div>
        <textarea
          placeholder={t("placeholders.aboutMe")}
          className="textarea w-full"
          rows={3}
          value={data.aboutMe}
          onChange={(e) => onChange("aboutMe", e.target.value)}
        />
      </div>
    ),
  };

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionTitle
          icon={<WorkHistoryIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.workExperience")}
        />
        <div className="flex flex-col gap-4">
          {data.workExperience.map((entry) => (
            <div
              key={entry.id}
              className="border-base-300 flex flex-col gap-2 rounded-lg border p-4"
            >
              <div className="flex justify-end">
                <RemoveButton
                  label={t("aria.removeWorkExperience")}
                  onClick={() => removeWorkEntry(entry.id)}
                />
              </div>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.yourPosition")}
                  className="input w-full"
                  value={entry.position}
                  onChange={(e) =>
                    updateWorkEntry(entry.id, "position", e.target.value)
                  }
                />
              </fieldset>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.startDateWork")}
                  className="input w-full"
                  value={entry.dateFrom}
                  onChange={(e) =>
                    updateWorkEntry(entry.id, "dateFrom", e.target.value)
                  }
                />
              </fieldset>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.endDateWork")}
                  className="input w-full"
                  value={entry.dateTo}
                  onChange={(e) =>
                    updateWorkEntry(entry.id, "dateTo", e.target.value)
                  }
                />
              </fieldset>
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
                  placeholder={t("placeholders.describeResponsibilities")}
                  className="textarea w-full"
                  rows={4}
                  value={entry.jobDescription}
                  onChange={(e) =>
                    updateWorkEntry(entry.id, "jobDescription", e.target.value)
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
            {t("buttons.addWorkExperience")}
          </button>
        </div>
      </>
    ),

    education: (
      <>
        <SectionTitle
          icon={<EducationIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.education")}
        />
        <div className="flex flex-col gap-4">
          {data.education.map((entry) => (
            <div
              key={entry.id}
              className="border-base-300 flex flex-col gap-2 rounded-lg border p-4"
            >
              <div className="flex justify-end">
                <RemoveButton
                  label={t("aria.removeEducation")}
                  onClick={() => removeEducationEntry(entry.id)}
                />
              </div>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.subjectOfStudy")}
                  className="input w-full"
                  value={entry.subject}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, "subject", e.target.value)
                  }
                />
              </fieldset>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.startDateEducation")}
                  className="input w-full"
                  value={entry.dateFrom}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, "dateFrom", e.target.value)
                  }
                />
              </fieldset>
              <fieldset className="fieldset">
                <input
                  type="text"
                  placeholder={t("placeholders.endDateEducation")}
                  className="input w-full"
                  value={entry.dateTo}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, "dateTo", e.target.value)
                  }
                />
              </fieldset>
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
                  placeholder={t("placeholders.describeStudies")}
                  className="textarea w-full"
                  rows={4}
                  value={entry.description}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, "description", e.target.value)
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
            {t("buttons.addEducation")}
          </button>
        </div>
      </>
    ),

    skills: (
      <>
        <SectionTitle
          icon={<SkillsIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.skills")}
        />
        <div className="flex flex-col gap-2">
          {data.skills.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
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
          ))}
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
        <SectionTitle
          icon={<CertificationsIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.certifications")}
        />
        <div className="flex flex-col gap-2">
          {data.certifications.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
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
              <fieldset className="fieldset flex-1">
                <input
                  type="text"
                  placeholder={t("placeholders.date")}
                  className="input w-full"
                  value={entry.date}
                  onChange={(e) =>
                    updateCertification(entry.id, "date", e.target.value)
                  }
                />
              </fieldset>
              <RemoveButton
                label={t("aria.removeCertification")}
                onClick={() => removeCertification(entry.id)}
              />
            </div>
          ))}
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
        <SectionTitle
          icon={<LanguagesIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.languages")}
        />
        <div className="flex flex-col gap-2">
          {data.languages.map((entry) => {
            const levelIndex = languageLevels.indexOf(entry.level);
            return (
              <div
                key={entry.id}
                className="border-base-300 flex flex-col gap-2 rounded-lg border p-4"
              >
                <div className="flex items-end gap-2">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourLanguage")}
                      className="input w-full"
                      value={entry.language}
                      onChange={(e) =>
                        updateLanguage(entry.id, "language", e.target.value)
                      }
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeLanguage")}
                    onClick={() => removeLanguage(entry.id)}
                  />
                </div>
                <div
                  className="flex items-center gap-2"
                  aria-label="Language proficiency level"
                >
                  <span className="text-xs whitespace-nowrap text-gray-500">
                    {entry.level}
                  </span>
                  <div className="rating">
                    {languageLevels.map((level, index) => (
                      <input
                        key={level}
                        type="radio"
                        name={`language-level-${entry.id}`}
                        aria-label={level}
                        className="mask mask-star"
                        checked={index === levelIndex}
                        onChange={() =>
                          updateLanguage(entry.id, "level", level)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
        <SectionTitle
          icon={<InterestsIcon className="h-6 w-6 stroke-current text-gray-500" />}
          title={t("sections.interests")}
        />
        <div className="flex flex-col gap-2">
          {data.interests.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
                <input
                  type="text"
                  placeholder={t("placeholders.yourInterest")}
                  className="input w-full"
                  value={entry.value}
                  onChange={(e) => updateInterest(entry.id, e.target.value)}
                />
              </fieldset>
              <RemoveButton
                label={t("aria.removeInterest")}
                onClick={() => removeInterest(entry.id)}
              />
            </div>
          ))}
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

  return (
    <div className="flex flex-col gap-4">
      {(
        [
          "photo",
          "name",
          "jobTitle",
          "phone",
          "email",
          "address",
          "website",
          "linkedin",
          "aboutMe",
        ] as FieldKey[]
      )
        .filter(isVisible)
        .map((key) => <div key={key}>{fieldContent[key]}</div>)}

      {sectionOrder.map((key) => (
        <div key={key}>{sectionContent[key]}</div>
      ))}
    </div>
  );
}
