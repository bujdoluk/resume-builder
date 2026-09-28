import type { SavedDocumentSort } from "@/components/SavedDocumentsPageContent";
import type { ListTab } from "@/types/ui";

export interface DocumentQueryKeys {
  all: (userId: string) => readonly unknown[];
  count: (userId: string) => readonly unknown[];
  deletedCount: (userId: string) => readonly unknown[];
  list: (userId: string, tab: ListTab, sort: SavedDocumentSort, page: number) => readonly unknown[];
}

// Every consumer must share these keys so one invalidateQueries reaches all of them.
export const queryKeys = {
  session: () => ["session"] as const,
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

  // Uses the current session, so the key has no userId.
  mfaFactor: () => ["mfaFactor"] as const,
} as const;
