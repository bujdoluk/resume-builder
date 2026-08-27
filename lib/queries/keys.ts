import type { SavedDocumentSort } from "@/components/SavedDocumentsPageContent";
import type { ListTab } from "@/types/ui";

/** Structural shape SavedDocumentsPageContent needs — queryKeys.resumes/coverLetters both satisfy it. */
export interface DocumentQueryKeys {
  all: (userId: string) => readonly unknown[];
  count: (userId: string) => readonly unknown[];
  deletedCount: (userId: string) => readonly unknown[];
  list: (userId: string, tab: ListTab, sort: SavedDocumentSort, page: number) => readonly unknown[];
}

/**
 * Centralized query-key factory. Every consumer of a given piece of data
 * (e.g. resume count is read by both Sidebar and the free-tier limit check
 * in ResumeBuilder) must use the same key here so a single
 * queryClient.invalidateQueries call reaches all of them — this replaces the
 * old resumeListVersion/coverLetterListVersion counters in AppState.tsx.
 */
export const queryKeys = {
  /** The raw Supabase Session (or null) — used by useIsAdmin/AuthButton for role/email display. */
  session: () => ["session"] as const,
  /** ensureUserId's resolved id (anonymous sign-in performed if needed) — used by every data-owning read/write. */
  userId: () => ["userId"] as const,
  isAdmin: () => ["isAdmin"] as const,
  subscription: (userId: string) => ["subscription", userId] as const,

  resumes: {
    all: (userId: string) => ["resumes", userId] as const,
    count: (userId: string) => ["resumes", userId, "count"] as const,
    deletedCount: (userId: string) => ["resumes", userId, "deletedCount"] as const,
    list: (userId: string, tab: ListTab, sort: SavedDocumentSort, page: number) =>
      ["resumes", userId, "list", tab, sort.column, sort.ascending, page] as const,
    detail: (id: string) => ["resumes", "detail", id] as const,
  },

  coverLetters: {
    all: (userId: string) => ["coverLetters", userId] as const,
    count: (userId: string) => ["coverLetters", userId, "count"] as const,
    deletedCount: (userId: string) => ["coverLetters", userId, "deletedCount"] as const,
    list: (userId: string, tab: ListTab, sort: SavedDocumentSort, page: number) =>
      ["coverLetters", userId, "list", tab, sort.column, sort.ascending, page] as const,
    detail: (id: string) => ["coverLetters", "detail", id] as const,
  },

  /** getTotpFactor operates on the current session, not a passed-in userId — one factor per tab. */
  mfaFactor: () => ["mfaFactor"] as const,
} as const;
