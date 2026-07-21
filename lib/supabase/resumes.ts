
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import type { FieldKey } from "@/lib/fields";
import { defaultFontSizeKey, type FontSizeKey } from "@/lib/fontSize";
import type { FontKey } from "@/lib/fonts";
import type { ModernSectionZones, ResumeData, SectionKey } from "@/lib/resumeData";
import type { TemplateId } from "@/lib/templates";

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
  createdAt: string;
  updatedAt: string;
}

interface ResumeTableRow {
  id: string;
  name: string;
  template_id: string;
  color: string | null;
  font: string | null;
  font_size: string | null;
  section_order: SectionKey[];
  visible_fields: FieldKey[];
  modern_section_zones: ModernSectionZones | null;
  data: ResumeData;
  created_at: string;
  updated_at: string;
}

function fromTableRow(row: ResumeTableRow): ResumeRow {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id as TemplateId,
    color: row.color,
    font: row.font as FontKey | null,
    fontSize: row.font_size as FontSizeKey | null,
    sectionOrder: row.section_order,
    visibleFields: row.visible_fields,
    modernSectionZones: row.modern_section_zones ?? {},
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function saveResume(supabase: SupabaseClient, params: SaveResumeParams): Promise<ResumeRow> {
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
    data: params.data,
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
  return fromTableRow(data as ResumeTableRow);
}

export async function countResumes(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export const RESUMES_PAGE_SIZE = 12;

export interface ResumeSort {
  column: "name" | "created_at" | "updated_at";
  ascending: boolean;
}

const DEFAULT_RESUME_SORT: ResumeSort = { column: "updated_at", ascending: true };

export async function listResumes(
  supabase: SupabaseClient,
  userId: string,
  page = 1,
  pageSize = RESUMES_PAGE_SIZE,
  sort: ResumeSort = DEFAULT_RESUME_SORT,
): Promise<ResumeRow[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("user_id", userId)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return (data as ResumeTableRow[]).map(fromTableRow);
}

export async function listAllResumes(supabase: SupabaseClient, userId: string): Promise<ResumeRow[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as ResumeTableRow[]).map(fromTableRow);
}

export async function getResume(supabase: SupabaseClient, id: string): Promise<ResumeRow | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data as ResumeTableRow) : null;
}

export async function deleteResume(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteResumes(supabase: SupabaseClient, ids: string[]): Promise<void> {
  const { error } = await supabase.from("resumes").delete().in("id", ids);
  if (error) throw error;
}

export async function renameResume(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ name, updated_at: Temporal.Now.instant().toString() })
    .eq("id", id);

  if (error) throw error;
}

export function nextCopyName(name: string): string {
  const match = name.match(/^(.*) \(Copy\)(?: (\d+))?$/);
  if (!match) return `${name} (Copy)`;

  const [, base, count] = match;
  const nextCount = count ? Number(count) + 1 : 2;
  return `${base} (Copy) ${nextCount}`;
}

export async function duplicateResume(supabase: SupabaseClient, id: string, userId: string): Promise<ResumeRow> {
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
