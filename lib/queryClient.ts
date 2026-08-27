import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";

/**
 * A fresh client per browser tab (created inside a useState initializer in
 * QueryProvider) so server-rendering the root layout never shares a cache
 * across requests. Nothing in this app prefetches into the cache server-side,
 * so there's no hydration boundary to wire up here.
 *
 * Query/mutation failures are reported here once, centrally, replacing the
 * try/catch + Sentry.captureException scattered across every hand-rolled
 * fetch effect this migration replaces.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => Sentry.captureException(error),
    }),
    mutationCache: new MutationCache({
      onError: (error) => Sentry.captureException(error),
    }),
  });
}
