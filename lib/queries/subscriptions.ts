"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryKeys } from "@/lib/queries/keys";
import type { Database } from "@/lib/supabase/database.types";
import { getSubscription } from "@/lib/supabase/subscriptions";
import type { Subscription } from "@/types/subscription";

export function useSubscriptionQuery(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): UseQueryResult<Subscription> {
  return useQuery({
    queryKey: queryKeys.subscription(userId ?? ""),
    queryFn: () => getSubscription(supabase, userId!),
    enabled: !!userId,
  });
}
