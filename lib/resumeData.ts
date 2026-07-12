/**
 * Core resume data model: every repeatable-entry shape (work experience,
 * education, skills, certifications, languages, interests), the top-level
 * `ResumeData` combining them with personal-info fields, section keys/
 * labels, and the empty/default resume value.
 */
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
  date: string;
}

export type SectionKey =
  | "workExperience"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "interests";

export const sectionLabels: Record<SectionKey, string> = {
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Interests",
};

// Which of the Modern template's two visual zones (dark/accent sidebar vs.
// plain main column) a section — or the "aboutMe" personal-info field,
// which is also freely draggable between zones — renders in. Stored
// per-resume rather than fixed, since it's user-reassignable by dragging.
export type ModernZoneItem = SectionKey | "aboutMe";
export type ModernSectionZone = "sidebar" | "main";
export type ModernSectionZones = Partial<Record<ModernZoneItem, ModernSectionZone>>;

// Today's layout, preserved as the fallback for any section/field not yet
// explicitly placed by the user (including every resume saved before this
// feature existed) — so an empty/missing zone map renders identically to
// the old hardcoded layout.
export const defaultModernSectionZones: Record<ModernZoneItem, ModernSectionZone> = {
  workExperience: "main",
  education: "main",
  interests: "main",
  skills: "sidebar",
  certifications: "sidebar",
  languages: "sidebar",
  aboutMe: "main",
};

export function resolveModernSectionZone(
  key: ModernZoneItem,
  zones: ModernSectionZones,
): ModernSectionZone {
  return zones[key] ?? defaultModernSectionZones[key];
}

// Splits an ordered section list into the two zones, preserving each zone's
// relative order — the single place every Modern-rendering file (editable
// canvas, mobile form, read-only template, PDF template) derives its
// sidebar/main key lists from, replacing what used to be a hardcoded
// `SectionKey[]` literal in each of those four files.
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
};
