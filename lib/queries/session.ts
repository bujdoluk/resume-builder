"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import type { Database } from "@/lib/supabase/database.types";
import { ensureUserId } from "@/lib/supabase/session";

/** The current Supabase session (or null), kept live via onAuthStateChange. */
export function useSessionQuery(supabase: SupabaseClient<Database>): UseQueryResult<Session | null> {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(queryKeys.session(), session);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
  });
}

/** Whether the current session belongs to an admin, kept live via onAuthStateChange. */
export function useIsAdminQuery(supabase: SupabaseClient<Database>): UseQueryResult<boolean> {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(queryKeys.isAdmin(), session?.user?.app_metadata?.role === "admin");
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: queryKeys.isAdmin(),
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.user?.app_metadata?.role === "admin";
    },
  });
}

/**
 * The current user's id — anonymous sign-in is performed on first read if
 * there's no session (see ensureUserId). No auth-state subscription here:
 * unlike session/isAdmin above, callers of ensureUserId never lived-updated
 * on auth changes even before this migration (each imperative save/delete
 * handler just re-calls ensureUserId fresh); an actual login/logout instead
 * invalidates this and every other user-scoped query via QueryAuthSync.
 */
export function useUserIdQuery(supabase: SupabaseClient<Database>): UseQueryResult<string> {
  return useQuery({
    queryKey: queryKeys.userId(),
    queryFn: () => ensureUserId(supabase),
    staleTime: Infinity,
  });
}
