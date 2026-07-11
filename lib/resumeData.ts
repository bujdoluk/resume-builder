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
