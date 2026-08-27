"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import type { Database } from "@/lib/supabase/database.types";
import {
  countDeletedCoverLetters,
  countCoverLetters,
  getCoverLetter,
  saveCoverLetter,
  type SaveCoverLetterParams,
} from "@/lib/supabase/coverLetters";
import type { CoverLetterRow } from "@/types/coverLetter";

export function useCoverLetterCountQuery(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.coverLetters.count(userId ?? ""),
    queryFn: () => countCoverLetters(supabase, userId!),
    enabled: !!userId,
  });
}

export function useDeletedCoverLetterCountQuery(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.coverLetters.deletedCount(userId ?? ""),
    queryFn: () => countDeletedCoverLetters(supabase, userId!),
    enabled: !!userId,
  });
}

/** Loads an existing cover letter by id (used by CoverLetterBuilder when editing a saved one). */
export function useCoverLetterQuery(
  supabase: SupabaseClient<Database>,
  id: string | null,
): UseQueryResult<CoverLetterRow | null> {
  return useQuery({
    queryKey: queryKeys.coverLetters.detail(id ?? ""),
    queryFn: () => getCoverLetter(supabase, id!),
    enabled: !!id,
  });
}

export function useSaveCoverLetterMutation(
  supabase: SupabaseClient<Database>,
): UseMutationResult<CoverLetterRow, Error, SaveCoverLetterParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveCoverLetterParams) => saveCoverLetter(supabase, params),
    onSuccess: (row, params) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coverLetters.all(params.userId) });
      queryClient.setQueryData(queryKeys.coverLetters.detail(row.id), row);
    },
  });
}
