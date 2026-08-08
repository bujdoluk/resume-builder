
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import { RESUMES_PAGE_SIZE, SHARE_LINK_EXPIRATION_DAYS } from "@/lib/constants";
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
import type { Database, Json, Tables } from "@/lib/supabase/database.types";
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
  shareToken: string | null;
  shareTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

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

export async function countResumes(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export interface ResumeSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}

const DEFAULT_RESUME_SORT: ResumeSort = { column: "updated_at", ascending: true };
const DEFAULT_DELETED_RESUME_SORT: ResumeSort = { column: "deleted_at", ascending: false };

export async function listResumes(
  supabase: SupabaseClient<Database>,
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
    .is("deleted_at", null)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function listAllResumes(supabase: SupabaseClient<Database>, userId: string): Promise<ResumeRow[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function listDeletedResumes(
  supabase: SupabaseClient<Database>,
  userId: string,
  page = 1,
  pageSize = RESUMES_PAGE_SIZE,
  sort: ResumeSort = DEFAULT_DELETED_RESUME_SORT,
): Promise<ResumeRow[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function countDeletedResumes(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("deleted_at", "is", null);

  if (error) throw error;
  return count ?? 0;
}

export async function getResume(supabase: SupabaseClient<Database>, id: string): Promise<ResumeRow | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data) : null;
}

export interface EnableSharingResult {
  token: string;
  expiresAt: string;
}

export async function enableResumeSharing(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EnableSharingResult> {
  const token = crypto.randomUUID();
  const expiresAt = Temporal.Now.instant().add({ hours: SHARE_LINK_EXPIRATION_DAYS * 24 }).toString({ fractionalSecondDigits: 3 });
  const { error } = await supabase
    .from("resumes")
    .update({ share_token: token, share_token_expires_at: expiresAt })
    .eq("id", id);
  if (error) throw error;
  return { token, expiresAt };
}

export async function disableResumeSharing(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ share_token: null, share_token_expires_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function getResumeByShareToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<ResumeRow | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select()
    .eq("share_token", token)
    .gt("share_token_expires_at", Temporal.Now.instant().toString())
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data) : null;
}

export async function deleteResume(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({
      deleted_at: Temporal.Now.instant().toString(),
      share_token: null,
      share_token_expires_at: null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteResumes(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({
      deleted_at: Temporal.Now.instant().toString(),
      share_token: null,
      share_token_expires_at: null,
    })
    .in("id", ids);
  if (error) throw error;
}

export async function restoreResume(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function restoreResumes(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ deleted_at: null })
    .in("id", ids)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function permanentlyDeleteResume(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function permanentlyDeleteResumes(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .in("id", ids)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function renameResume(supabase: SupabaseClient<Database>, id: string, name: string): Promise<void> {
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
