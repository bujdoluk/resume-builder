"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Wipes the entire query cache on a real identity change (sign-in/sign-out)
 * so no user-scoped data (resume/cover-letter counts and lists, subscription,
 * mfaFactor, session, isAdmin, userId — most cached with staleTime: Infinity
 * or a long staleTime) survives across an anonymous -> real-user transition
 * or a log-out. Mounted once at the app root, separate from QueryProvider so
 * component tests can wrap with a plain QueryClientProvider without needing
 * a real Supabase auth client.
 */
export default function QueryAuthSync() {
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, queryClient]);

  return null;
}
