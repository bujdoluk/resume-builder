/**
 * CRUD operations against the Supabase `cover_letters` table — the cover
 * letter counterpart of `lib/supabase/resumes.ts`, kept simpler since
 * there's only one template: save (insert or update), get/list/count by
 * user, delete, rename, and duplicate a cover letter.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import type { CoverLetterData } from "@/lib/coverLetterData";
import { nextCopyName } from "@/lib/supabase/resumes";

export interface CoverLetterRow {
  id: string;
  name: string;
  data: CoverLetterData;
  createdAt: string;
  updatedAt: string;
}

interface CoverLetterTableRow {
  id: string;
  name: string;
  data: CoverLetterData;
  created_at: string;
  updated_at: string;
}

function fromTableRow(row: CoverLetterTableRow): CoverLetterRow {
  return {
    id: row.id,
    name: row.name,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SaveCoverLetterParams {
  id: string | null;
  userId: string;
  name: string;
  data: CoverLetterData;
}

export async function saveCoverLetter(
  supabase: SupabaseClient,
  params: SaveCoverLetterParams,
): Promise<CoverLetterRow> {
  const payload = {
    user_id: params.userId,
    name: params.name,
    data: params.data,
    updated_at: Temporal.Now.instant().toString(),
  };

  const query = params.id
    ? supabase.from("cover_letters").update(payload).eq("id", params.id).select().single()
    : supabase.from("cover_letters").insert(payload).select().single();

  const { data, error } = await query;
  if (error || !data) throw error ?? new Error("Failed to save cover letter");
  return fromTableRow(data as CoverLetterTableRow);
}

export async function getCoverLetter(
  supabase: SupabaseClient,
  id: string,
): Promise<CoverLetterRow | null> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data as CoverLetterTableRow) : null;
}

export async function countCoverLetters(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("cover_letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export const COVER_LETTERS_PAGE_SIZE = 12;

export interface CoverLetterSort {
  column: "name" | "created_at" | "updated_at";
  ascending: boolean;
}

const DEFAULT_COVER_LETTER_SORT: CoverLetterSort = {
  column: "updated_at",
  ascending: true,
};

export async function listCoverLetters(
  supabase: SupabaseClient,
  userId: string,
  page = 1,
  pageSize = COVER_LETTERS_PAGE_SIZE,
  sort: CoverLetterSort = DEFAULT_COVER_LETTER_SORT,
): Promise<CoverLetterRow[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("user_id", userId)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return (data as CoverLetterTableRow[]).map(fromTableRow);
}

export async function deleteCoverLetter(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("cover_letters").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCoverLetters(supabase: SupabaseClient, ids: string[]): Promise<void> {
  const { error } = await supabase.from("cover_letters").delete().in("id", ids);
  if (error) throw error;
}

export async function renameCoverLetter(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({ name, updated_at: Temporal.Now.instant().toString() })
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateCoverLetter(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<CoverLetterRow> {
  const original = await getCoverLetter(supabase, id);
  if (!original) throw new Error("Cover letter not found");

  return saveCoverLetter(supabase, {
    id: null,
    userId,
    name: nextCopyName(original.name),
    data: original.data,
  });
}
