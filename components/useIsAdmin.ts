"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useIsAdmin(): boolean {
  const [supabase] = useState(() => createClient());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.app_metadata?.role === "admin");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.app_metadata?.role === "admin");
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return isAdmin;
}
