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

export interface CertificationEntry {
  id: string;
  name: string;
  date: string;
}

export type SectionKey =
  | "workHistory"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "interests";

export const sectionLabels: Record<SectionKey, string> = {
  workHistory: "Work History",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
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
  linkedin: string;
  aboutMe: string;
  workHistory: WorkEntry[];
  education: EducationEntry[];
  skills: SimpleEntry[];
  certifications: CertificationEntry[];
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
  linkedin: "",
  aboutMe: "",
  workHistory: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  interests: [],
};
