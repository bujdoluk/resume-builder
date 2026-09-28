import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";

// One client per tab so SSR never shares a cache across requests. Failures are reported centrally here.
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
