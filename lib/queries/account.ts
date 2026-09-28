"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import { getTotpFactor } from "@/lib/supabase/auth";
import type { Database } from "@/lib/supabase/database.types";
import type { TotpFactor } from "@/types/auth";

// undefined while loading, null when no factor is enrolled.
export function useMfaFactorQuery(
  supabase: SupabaseClient<Database>,
  enabled: boolean,
): UseQueryResult<TotpFactor | null> {
  return useQuery({
    queryKey: queryKeys.mfaFactor(),
    queryFn: () => getTotpFactor(supabase),
    enabled,
  });
}
