"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import type { Database } from "@/lib/supabase/database.types";
import { ensureUserId } from "@/lib/supabase/session";

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

// Signs in anonymously if there's no session. Login and logout invalidate it via QueryAuthSync.
export function useUserIdQuery(supabase: SupabaseClient<Database>): UseQueryResult<string> {
  return useQuery({
    queryKey: queryKeys.userId(),
    queryFn: () => ensureUserId(supabase),
    staleTime: Infinity,
  });
}
