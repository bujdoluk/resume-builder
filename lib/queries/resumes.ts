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
  countDeletedResumes,
  countResumes,
  getResume,
  saveResume,
  type SaveResumeParams,
} from "@/lib/supabase/resumes";
import type { ResumeRow } from "@/types/resume";

export function useResumeCountQuery(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.resumes.count(userId ?? ""),
    queryFn: () => countResumes(supabase, userId!),
    enabled: !!userId,
  });
}

export function useDeletedResumeCountQuery(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.resumes.deletedCount(userId ?? ""),
    queryFn: () => countDeletedResumes(supabase, userId!),
    enabled: !!userId,
  });
}

/** Loads an existing resume by id (used by ResumeBuilder when editing a saved resume). */
export function useResumeQuery(
  supabase: SupabaseClient<Database>,
  id: string | null,
): UseQueryResult<ResumeRow | null> {
  return useQuery({
    queryKey: queryKeys.resumes.detail(id ?? ""),
    queryFn: () => getResume(supabase, id!),
    enabled: !!id,
  });
}

export function useSaveResumeMutation(
  supabase: SupabaseClient<Database>,
): UseMutationResult<ResumeRow, Error, SaveResumeParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveResumeParams) => saveResume(supabase, params),
    onSuccess: (row, params) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all(params.userId) });
      queryClient.setQueryData(queryKeys.resumes.detail(row.id), row);
    },
  });
}
