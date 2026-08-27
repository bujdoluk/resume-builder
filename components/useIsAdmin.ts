"use client";

import { useState } from "react";
import { useIsAdminQuery } from "@/lib/queries/session";
import { createClient } from "@/lib/supabase/client";

export function useIsAdmin(): boolean {
  const [supabase] = useState(() => createClient());
  const { data: isAdmin } = useIsAdminQuery(supabase);
  return isAdmin ?? false;
}
