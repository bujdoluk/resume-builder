
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import { parseStoredCoverLetterData, stampCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { COVER_LETTERS_PAGE_SIZE, SHARE_LINK_EXPIRATION_DAYS } from "@/lib/constants";
import { nextCopyName, type EnableSharingResult } from "@/lib/supabase/resumes";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";

export interface CoverLetterRow {
  id: string;
  name: string;
  data: CoverLetterData;
  shareToken: string | null;
  shareTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function fromTableRow(row: Tables<"cover_letters">): CoverLetterRow {
  return {
    id: row.id,
    name: row.name,
    data: parseStoredCoverLetterData(row.data),
    shareToken: row.share_token,
    shareTokenExpiresAt: row.share_token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export interface SaveCoverLetterParams {
  id: string | null;
  userId: string;
  name: string;
  data: CoverLetterData;
}

export async function saveCoverLetter(
  supabase: SupabaseClient<Database>,
  params: SaveCoverLetterParams,
): Promise<CoverLetterRow> {
  const payload = {
    user_id: params.userId,
    name: params.name,
    // See the matching comment in resumes.ts's saveResume — same cast, same
    // reason (stampCoverLetterData's return type is intentionally broad).
    data: stampCoverLetterData(params.data) as Json,
    updated_at: Temporal.Now.instant().toString(),
  };

  const query = params.id
    ? supabase.from("cover_letters").update(payload).eq("id", params.id).select().single()
    : supabase.from("cover_letters").insert(payload).select().single();

  const { data, error } = await query;
  if (error || !data) throw error ?? new Error("Failed to save cover letter");
  return fromTableRow(data);
}

export async function getCoverLetter(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CoverLetterRow | null> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data) : null;
}

// Generates a new public share token and saves it on the caller's own
// (owner-scoped, RLS-protected) row — never called with a service-role
// client. Overwrites any existing token, invalidating a previously shared
// link.
export async function enableCoverLetterSharing(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EnableSharingResult> {
  const token = crypto.randomUUID();
  const expiresAt = Temporal.Now.instant().add({ hours: SHARE_LINK_EXPIRATION_DAYS * 24 }).toString({ fractionalSecondDigits: 3 });
  const { error } = await supabase
    .from("cover_letters")
    .update({ share_token: token, share_token_expires_at: expiresAt })
    .eq("id", id);
  if (error) throw error;
  return { token, expiresAt };
}

export async function disableCoverLetterSharing(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({ share_token: null, share_token_expires_at: null })
    .eq("id", id);
  if (error) throw error;
}

// Public, unauthenticated lookup for the /shared/cover-letter/[token] page —
// only ever called with a service-role client from a server-only route, see
// getResumeByShareToken in resumes.ts for why. The expiry filter makes an
// expired token behave identically to an unknown one.
export async function getCoverLetterByShareToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<CoverLetterRow | null> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("share_token", token)
    .gt("share_token_expires_at", Temporal.Now.instant().toString())
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data ? fromTableRow(data) : null;
}

export async function listAllCoverLetters(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CoverLetterRow[]> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function countCoverLetters(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("cover_letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export interface CoverLetterSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}

const DEFAULT_COVER_LETTER_SORT: CoverLetterSort = {
  column: "updated_at",
  ascending: true,
};

const DEFAULT_DELETED_COVER_LETTER_SORT: CoverLetterSort = {
  column: "deleted_at",
  ascending: false,
};

export async function listCoverLetters(
  supabase: SupabaseClient<Database>,
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
    .is("deleted_at", null)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function listDeletedCoverLetters(
  supabase: SupabaseClient<Database>,
  userId: string,
  page = 1,
  pageSize = COVER_LETTERS_PAGE_SIZE,
  sort: CoverLetterSort = DEFAULT_DELETED_COVER_LETTER_SORT,
): Promise<CoverLetterRow[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("cover_letters")
    .select()
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) throw error;
  return data.map(fromTableRow);
}

export async function countDeletedCoverLetters(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("cover_letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("deleted_at", "is", null);

  if (error) throw error;
  return count ?? 0;
}

export async function deleteCoverLetter(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({
      deleted_at: Temporal.Now.instant().toString(),
      share_token: null,
      share_token_expires_at: null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoverLetters(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({
      deleted_at: Temporal.Now.instant().toString(),
      share_token: null,
      share_token_expires_at: null,
    })
    .in("id", ids);
  if (error) throw error;
}

export async function restoreCoverLetter(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function restoreCoverLetters(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({ deleted_at: null })
    .in("id", ids)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function permanentlyDeleteCoverLetter(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function permanentlyDeleteCoverLetters(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .delete()
    .in("id", ids)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

export async function renameCoverLetter(supabase: SupabaseClient<Database>, id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("cover_letters")
    .update({ name, updated_at: Temporal.Now.instant().toString() })
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateCoverLetter(
  supabase: SupabaseClient<Database>,
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
