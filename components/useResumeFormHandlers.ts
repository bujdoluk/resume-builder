import {
  languageLevels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";

export interface ResumeFormHandlersProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onWorkHistoryChange: (workExperience: WorkEntry[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onSkillsChange: (skills: SimpleEntry[]) => void;
  onCertificationsChange: (certifications: CertificationEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
  onInterestsChange: (interests: SimpleEntry[]) => void;
}

// Every add/update/remove function needed to edit a resume's entries, shared
// across the desktop canvas and the per-template mobile forms so this logic
// exists in exactly one place.
export function createResumeFormHandlers({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onCertificationsChange,
  onLanguagesChange,
  onInterestsChange,
}: ResumeFormHandlersProps) {
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

  return {
    handlePhotoChange,
    addWorkEntry,
    updateWorkEntry,
    removeWorkEntry,
    addEducationEntry,
    updateEducationEntry,
    removeEducationEntry,
    addSkill,
    updateSkill,
    removeSkill,
    addCertification,
    updateCertification,
    removeCertification,
    addLanguage,
    updateLanguage,
    removeLanguage,
    addInterest,
    updateInterest,
    removeInterest,
  };
}
