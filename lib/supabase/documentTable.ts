
import type { SupabaseClient } from "@supabase/supabase-js";
import { Temporal } from "temporal-polyfill";
import { SHARE_LINK_EXPIRATION_DAYS } from "@/lib/constants";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { EnableSharingResult } from "@/types/share";

type Document = "resumes" | "cover_letters";

interface DocumentSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}

export interface TableConfig<TableName extends Document, Row, Sort extends DocumentSort> {
  table: TableName;
  fromTableRow: (row: Tables<TableName>) => Row;
  pageSize: number;
  defaultSort: Sort;
  defaultDeletedSort: Sort;
}

export function createDocumentTableHelpers<TableName extends Document, Row, Sort extends DocumentSort>(
  { table, fromTableRow, pageSize: defaultPageSize, defaultSort, defaultDeletedSort }: TableConfig<TableName, Row, Sort>) {

  function query(supabase: SupabaseClient<Database>) {
    return supabase.from(table as "resumes");
  }

  async function count(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
    const { count, error } = await query(supabase)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) throw error;
    return count ?? 0;
  }

  async function countDeleted(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
    const { count, error } = await query(supabase)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("deleted_at", "is", null);

    if (error) throw error;
    return count ?? 0;
  }

  async function list(
    supabase: SupabaseClient<Database>,
    userId: string,
    page = 1,
    pageSize = defaultPageSize,
    sort: Sort = defaultSort,
  ): Promise<Row[]> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query(supabase)
      .select()
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    if (error) throw error;
    return (data as Tables<TableName>[]).map(fromTableRow);
  }

  async function listDeleted(
    supabase: SupabaseClient<Database>,
    userId: string,
    page = 1,
    pageSize = defaultPageSize,
    sort: Sort = defaultDeletedSort,
  ): Promise<Row[]> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await query(supabase)
      .select()
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    if (error) throw error;
    return (data as Tables<TableName>[]).map(fromTableRow);
  }

  async function listAll(supabase: SupabaseClient<Database>, userId: string): Promise<Row[]> {
    const { data, error } = await query(supabase)
      .select()
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as Tables<TableName>[]).map(fromTableRow);
  }

  async function get(supabase: SupabaseClient<Database>, id: string): Promise<Row | null> {
    const { data, error } = await query(supabase)
      .select()
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? fromTableRow(data as Tables<TableName>) : null;
  }

  async function enableSharing(supabase: SupabaseClient<Database>, id: string): Promise<EnableSharingResult> {
    const token = crypto.randomUUID();
    const expiresAt = Temporal.Now.instant()
      .add({ hours: SHARE_LINK_EXPIRATION_DAYS * 24 })
      .toString({ fractionalSecondDigits: 3 });
    const { error } = await query(supabase)
      .update({ share_token: token, share_token_expires_at: expiresAt })
      .eq("id", id);
    if (error) throw error;
    return { token, expiresAt };
  }

  async function disableSharing(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await query(supabase)
      .update({ share_token: null, share_token_expires_at: null })
      .eq("id", id);
    if (error) throw error;
  }

  async function getByShareToken(supabase: SupabaseClient<Database>, token: string): Promise<Row | null> {
    const { data, error } = await query(supabase)
      .select()
      .eq("share_token", token)
      .gt("share_token_expires_at", Temporal.Now.instant().toString())
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? fromTableRow(data as Tables<TableName>) : null;
  }

  async function deleteOne(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await query(supabase)
      .update({
        deleted_at: Temporal.Now.instant().toString(),
        share_token: null,
        share_token_expires_at: null,
      })
      .eq("id", id);
    if (error) throw error;
  }

  async function deleteMany(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
    const { error } = await query(supabase)
      .update({
        deleted_at: Temporal.Now.instant().toString(),
        share_token: null,
        share_token_expires_at: null,
      })
      .in("id", ids);
    if (error) throw error;
  }

  async function restoreOne(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await query(supabase)
      .update({ deleted_at: null })
      .eq("id", id)
      .not("deleted_at", "is", null);
    if (error) throw error;
  }

  async function restoreMany(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
    const { error } = await query(supabase)
      .update({ deleted_at: null })
      .in("id", ids)
      .not("deleted_at", "is", null);
    if (error) throw error;
  }

  async function permanentlyDeleteOne(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await query(supabase)
      .delete()
      .eq("id", id)
      .not("deleted_at", "is", null);
    if (error) throw error;
  }

  async function permanentlyDeleteMany(supabase: SupabaseClient<Database>, ids: string[]): Promise<void> {
    const { error } = await query(supabase)
      .delete()
      .in("id", ids)
      .not("deleted_at", "is", null);
    if (error) throw error;
  }

  async function rename(supabase: SupabaseClient<Database>, id: string, name: string): Promise<void> {
    const { error } = await query(supabase)
      .update({ name, updated_at: Temporal.Now.instant().toString() })
      .eq("id", id);

    if (error) throw error;
  }

  return {
    count,
    countDeleted,
    list,
    listDeleted,
    listAll,
    get,
    enableSharing,
    disableSharing,
    getByShareToken,
    deleteOne,
    deleteMany,
    restoreOne,
    restoreMany,
    permanentlyDeleteOne,
    permanentlyDeleteMany,
    rename,
  };
}
