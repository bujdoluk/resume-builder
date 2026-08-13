
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import { parseStoredCoverLetterData, stampCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { COVER_LETTERS_PAGE_SIZE } from "@/lib/constants";
import { nextCopyName } from "@/lib/supabase/resumes";
import { createDocumentTableHelpers } from "@/lib/supabase/documentTable";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import type { CoverLetterRow, CoverLetterSort } from "@/types/coverLetter";

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

const DEFAULT_COVER_LETTER_SORT: CoverLetterSort = {
  column: "updated_at",
  ascending: true,
};

const DEFAULT_DELETED_COVER_LETTER_SORT: CoverLetterSort = {
  column: "deleted_at",
  ascending: false,
};

export const {
  count: countCoverLetters,
  countDeleted: countDeletedCoverLetters,
  list: listCoverLetters,
  listDeleted: listDeletedCoverLetters,
  listAll: listAllCoverLetters,
  get: getCoverLetter,
  enableSharing: enableCoverLetterSharing,
  disableSharing: disableCoverLetterSharing,
  getByShareToken: getCoverLetterByShareToken,
  deleteOne: deleteCoverLetter,
  deleteMany: deleteCoverLetters,
  restoreOne: restoreCoverLetter,
  restoreMany: restoreCoverLetters,
  permanentlyDeleteOne: permanentlyDeleteCoverLetter,
  permanentlyDeleteMany: permanentlyDeleteCoverLetters,
  rename: renameCoverLetter,
} = createDocumentTableHelpers<"cover_letters", CoverLetterRow, CoverLetterSort>({
  table: "cover_letters",
  fromTableRow,
  pageSize: COVER_LETTERS_PAGE_SIZE,
  defaultSort: DEFAULT_COVER_LETTER_SORT,
  defaultDeletedSort: DEFAULT_DELETED_COVER_LETTER_SORT,
});

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
