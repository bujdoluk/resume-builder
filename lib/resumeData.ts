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
  school: string;
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

export interface CertificationEntry {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
}

export type SectionKey =
  | "workExperience"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "interests"
  | "customFields";

export const sectionLabels: Record<SectionKey, string> = {
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Interests",
  customFields: "Custom Field",
};

export type ModernZoneItem = SectionKey | "aboutMe";
export type ModernSectionZone = "sidebar" | "main";
export type ModernSectionZones = Partial<Record<ModernZoneItem, ModernSectionZone>>;

export const defaultModernSectionZones: Record<ModernZoneItem, ModernSectionZone> = {
  workExperience: "main",
  education: "main",
  interests: "main",
  skills: "sidebar",
  certifications: "sidebar",
  languages: "sidebar",
  customFields: "main",
  aboutMe: "main",
};

export function resolveModernSectionZone(
  key: ModernZoneItem,
  zones: ModernSectionZones,
): ModernSectionZone {
  return zones[key] ?? defaultModernSectionZones[key];
}

export function splitSectionsByZone(
  order: SectionKey[],
  zones: ModernSectionZones,
): { sidebar: SectionKey[]; main: SectionKey[] } {
  const sidebar: SectionKey[] = [];
  const main: SectionKey[] = [];
  for (const key of order) {
    if (resolveModernSectionZone(key, zones) === "sidebar") {
      sidebar.push(key);
    } else {
      main.push(key);
    }
  }
  return { sidebar, main };
}

export interface ResumeData {
  photo: string;
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  linkedin: string;
  aboutMe: string;
  workExperience: WorkEntry[];
  education: EducationEntry[];
  skills: SimpleEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  interests: SimpleEntry[];
  customFieldValue: string;
  customFieldsTitle: string;
}

export const emptyResumeData: ResumeData = {
  photo: "",
  name: "",
  jobTitle: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  linkedin: "",
  aboutMe: "",
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  interests: [],
  customFieldValue: "",
  customFieldsTitle: "",
};
