import type { FieldKey } from "@/lib/fields";
import type { FontKey } from "@/lib/fonts";
import type { FontSizeKey } from "@/lib/fontSize";
import type { ModernSectionZones, ResumeData, SectionKey } from "@/lib/resumeData";
import type { TemplateId } from "@/lib/templates";

export type ImportFileType = "pdf" | "docx";

export type WorkEntryFieldKey = "position" | "dateFrom" | "dateTo" | "location" | "jobDescription";
export type EducationEntryFieldKey =
  | "school"
  | "subject"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "description";

export interface ResumeRow {
  id: string;
  name: string;
  templateId: TemplateId;
  color: string | null;
  font: FontKey | null;
  fontSize: FontSizeKey | null;
  sectionOrder: SectionKey[];
  visibleFields: FieldKey[];
  modernSectionZones: ModernSectionZones;
  data: ResumeData;
  shareToken: string | null;
  shareTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ResumeSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}
