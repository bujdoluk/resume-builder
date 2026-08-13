
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import { RESUMES_PAGE_SIZE } from "@/lib/constants";
import { visibleFieldsSchema, type FieldKey } from "@/lib/fields";
import { defaultFontSizeKey, type FontSizeKey } from "@/lib/fontSize";
import type { FontKey } from "@/lib/fonts";
import {
  modernSectionZonesSchema,
  parseStoredResumeData,
  sectionOrderSchema,
  stampResumeData,
  type ModernSectionZones,
  type ResumeData,
  type SectionKey,
} from "@/lib/resumeData";
import { createDocumentTableHelpers } from "@/lib/supabase/documentTable";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import type { TemplateId } from "@/lib/templates";
import type { ResumeRow, ResumeSort } from "@/types/resume";

function fromTableRow(row: Tables<"resumes">): ResumeRow {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id as TemplateId,
    color: row.color,
    font: row.font as FontKey | null,
    fontSize: row.font_size as FontSizeKey | null,
    sectionOrder: sectionOrderSchema.parse(row.section_order),
    visibleFields: visibleFieldsSchema.parse(row.visible_fields),
    modernSectionZones: modernSectionZonesSchema.parse(row.modern_section_zones),
    data: parseStoredResumeData(row.data),
    shareToken: row.share_token,
    shareTokenExpiresAt: row.share_token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export interface SaveResumeParams {
  id: string | null;
  userId: string;
  name: string;
  templateId: TemplateId;
  color: string | null;
  font: FontKey | null;
  fontSize: FontSizeKey;
  sectionOrder: SectionKey[];
  visibleFields: FieldKey[];
  modernSectionZones: ModernSectionZones;
  data: ResumeData;
}

export async function saveResume(
  supabase: SupabaseClient<Database>,
  params: SaveResumeParams,
): Promise<ResumeRow> {
  const payload = {
    user_id: params.userId,
    name: params.name,
    template_id: params.templateId,
    color: params.color,
    font: params.font,
    font_size: params.fontSize,
    section_order: params.sectionOrder,
    visible_fields: params.visibleFields,
    modern_section_zones: params.modernSectionZones,
    data: stampResumeData(params.data) as Json,
    updated_at: Temporal.Now.instant().toString(),
  };

  const query = params.id
    ? supabase
        .from("resumes")
        .update(payload)
        .eq("id", params.id)
        .select()
        .single()
    : supabase.from("resumes").insert(payload).select().single();

  const { data, error } = await query;
  if (error || !data) throw error ?? new Error("Failed to save resume");
  return fromTableRow(data);
}

const DEFAULT_RESUME_SORT: ResumeSort = { column: "updated_at", ascending: true };
const DEFAULT_DELETED_RESUME_SORT: ResumeSort = { column: "deleted_at", ascending: false };

export const {
  count: countResumes,
  countDeleted: countDeletedResumes,
  list: listResumes,
  listDeleted: listDeletedResumes,
  listAll: listAllResumes,
  get: getResume,
  enableSharing: enableResumeSharing,
  disableSharing: disableResumeSharing,
  getByShareToken: getResumeByShareToken,
  deleteOne: deleteResume,
  deleteMany: deleteResumes,
  restoreOne: restoreResume,
  restoreMany: restoreResumes,
  permanentlyDeleteOne: permanentlyDeleteResume,
  permanentlyDeleteMany: permanentlyDeleteResumes,
  rename: renameResume,
} = createDocumentTableHelpers<"resumes", ResumeRow, ResumeSort>({
  table: "resumes",
  fromTableRow,
  pageSize: RESUMES_PAGE_SIZE,
  defaultSort: DEFAULT_RESUME_SORT,
  defaultDeletedSort: DEFAULT_DELETED_RESUME_SORT,
});

export function nextCopyName(name: string): string {
  const match = name.match(/^(.*) \(Copy\)(?: (\d+))?$/);
  if (!match) return `${name} (Copy)`;

  const [, base, count] = match;
  const nextCount = count ? Number(count) + 1 : 2;
  return `${base} (Copy) ${nextCount}`;
}

export async function duplicateResume(
  supabase: SupabaseClient<Database>,
  id: string,
  userId: string,
): Promise<ResumeRow> {
  const original = await getResume(supabase, id);
  if (!original) throw new Error("Resume not found");

  return saveResume(supabase, {
    id: null,
    userId,
    name: nextCopyName(original.name),
    templateId: original.templateId,
    color: original.color,
    font: original.font,
    fontSize: original.fontSize ?? defaultFontSizeKey,
    sectionOrder: original.sectionOrder,
    visibleFields: original.visibleFields,
    modernSectionZones: original.modernSectionZones,
    data: original.data,
  });
}
