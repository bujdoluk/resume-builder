import { z } from "zod";
import { createVersionedCodec } from "@/lib/schemaVersion";

const idSchema = z.string().catch(() => crypto.randomUUID());

export const languageEntrySchema = z.object({
  id: idSchema,
  language: z.string().catch(""),
  level: z.string().catch(""),
});
export type LanguageEntry = z.infer<typeof languageEntrySchema>;

export const languageLevels = [
  "Beginner",
  "Advanced",
  "Full Professional Proficiency",
  "Native Speaker",
];

export const defaultLanguageLevel = languageLevels[0]!;

const languageLevelTranslationKeys: Record<string, string> = {
  Beginner: "languageLevels.beginner",
  Advanced: "languageLevels.advanced",
  "Full Professional Proficiency": "languageLevels.fullProfessionalProficiency",
  "Native Speaker": "languageLevels.nativeSpeaker",
};

export function languageLevelKey(level: string): string {
  return languageLevelTranslationKeys[level] ?? level;
}

export const workEntrySchema = z.object({
  id: idSchema,
  position: z.string().catch(""),
  dateFrom: z.string().catch(""),
  dateTo: z.string().catch(""),
  location: z.string().catch(""),
  jobDescription: z.string().catch(""),
});
export type WorkEntry = z.infer<typeof workEntrySchema>;

export const educationEntrySchema = z.object({
  id: idSchema,
  school: z.string().catch(""),
  subject: z.string().catch(""),
  location: z.string().catch(""),
  description: z.string().catch(""),
  dateFrom: z.string().catch(""),
  dateTo: z.string().catch(""),
});
export type EducationEntry = z.infer<typeof educationEntrySchema>;

export const simpleEntrySchema = z.object({
  id: idSchema,
  value: z.string().catch(""),
});
export type SimpleEntry = z.infer<typeof simpleEntrySchema>;

export const certificationEntrySchema = z.object({
  id: idSchema,
  name: z.string().catch(""),
  dateFrom: z.string().catch(""),
  dateTo: z.string().catch(""),
});
export type CertificationEntry = z.infer<typeof certificationEntrySchema>;

// Harvard-only sections are deliberately not in SECTION_KEYS; no other template renders them.
export const honorAwardEntrySchema = z.object({
  id: idSchema,
  name: z.string().catch(""),
  issuer: z.string().catch(""),
  dateFrom: z.string().catch(""),
  dateTo: z.string().catch(""),
});
export type HonorAwardEntry = z.infer<typeof honorAwardEntrySchema>;

const SECTION_KEYS = [
  "workExperience",
  "education",
  "skills",
  "certifications",
  "languages",
  "interests",
  "customFields",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];
export const sectionKeySchema = z.enum(SECTION_KEYS);

// Drop invalid entries instead of the whole order.
export const sectionOrderSchema: z.ZodType<SectionKey[]> = z
  .array(z.unknown())
  .catch([])
  .transform((items) => items.filter((item): item is SectionKey => sectionKeySchema.safeParse(item).success));

export const sectionLabels: Record<SectionKey, string> = {
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Interests",
  customFields: "Custom Field",
};

// Shared so the PDF, DOCX and text exporters use the same wording.
export const harvardSectionLabels = {
  leadershipExperience: "Leadership Experience",
  honorsAwards: "Honors & Awards",
} as const;

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

const modernZoneItemSchema = z.enum([...SECTION_KEYS, "aboutMe"] as const satisfies readonly ModernZoneItem[]);
const modernSectionZoneSchema = z.enum(["sidebar", "main"] as const satisfies readonly ModernSectionZone[]);

// Drop invalid entries instead of the whole object.
export const modernSectionZonesSchema: z.ZodType<ModernSectionZones> = z
  .record(z.string(), z.unknown())
  .catch({})
  .transform((value) => {
    const result: ModernSectionZones = {};
    for (const [key, zone] of Object.entries(value)) {
      const parsedKey = modernZoneItemSchema.safeParse(key);
      const parsedZone = modernSectionZoneSchema.safeParse(zone);
      if (parsedKey.success && parsedZone.success) {
        result[parsedKey.data] = parsedZone.data;
      }
    }
    return result;
  });

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

export const resumeDataSchema = z.object({
  photo: z.string().catch(""),
  name: z.string().catch(""),
  jobTitle: z.string().catch(""),
  phone: z.string().catch(""),
  email: z.string().catch(""),
  address: z.string().catch(""),
  website: z.string().catch(""),
  linkedin: z.string().catch(""),
  aboutMe: z.string().catch(""),
  workExperience: z.array(workEntrySchema).catch([]),
  education: z.array(educationEntrySchema).catch([]),
  skills: z.array(simpleEntrySchema).catch([]),
  certifications: z.array(certificationEntrySchema).catch([]),
  languages: z.array(languageEntrySchema).catch([]),
  interests: z.array(simpleEntrySchema).catch([]),
  customFieldValue: z.string().catch(""),
  customFieldsTitle: z.string().catch(""),
  leadershipExperience: z.array(workEntrySchema).catch([]),
  honorsAwards: z.array(honorAwardEntrySchema).catch([]),
});
export type ResumeData = z.infer<typeof resumeDataSchema>;

export const emptyResumeData: ResumeData = resumeDataSchema.parse({});

export const RESUME_SCHEMA_VERSION = 1;

// Keyed by the version being upgraded from. Rows without __schemaVersion count as version 0.
const resumeMigrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

const resumeCodec = createVersionedCodec<ResumeData>(RESUME_SCHEMA_VERSION, resumeMigrations);

export function stampResumeData(data: ResumeData): Record<string, unknown> {
  return resumeCodec.stamp(data);
}

// Use this, not a spread into emptyResumeData: the spread doesn't backfill nested keys or reject garbage.
export function parseStoredResumeData(raw: unknown): ResumeData {
  return resumeDataSchema.parse(resumeCodec.migrate(raw));
}
