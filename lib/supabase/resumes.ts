import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import type { FieldKey } from "@/lib/fields";
import type { FontSizeKey } from "@/lib/fontSize";
import type { FontKey } from "@/lib/fonts";
import type { ResumeData, SectionKey } from "@/lib/resumeData";
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
  data: ResumeData;
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
  data: ResumeData;
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
    data: row.data,
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

export async function listResumes(supabase: SupabaseClient, userId: string): Promise<ResumeRow[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

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

export async function renameResume(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ name, updated_at: Temporal.Now.instant().toString() })
    .eq("id", id);

  if (error) throw error;
}
