"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Clears the whole cache on sign in/out so no user data survives an identity change.
// Kept apart from QueryProvider so tests don't need a real auth client.
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
