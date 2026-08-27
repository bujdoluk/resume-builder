"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import { getTotpFactor } from "@/lib/supabase/auth";
import type { Database } from "@/lib/supabase/database.types";
import type { TotpFactor } from "@/types/auth";

/**
 * `data` is `undefined` while loading, `null` once resolved with no factor
 * enrolled, or the factor once enrolled — the same three-state shape
 * AccountPage's hand-rolled `useState<TotpFactor | null | undefined>` used,
 * so call sites don't need to change how they branch on it.
 */
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
