import type { CoverLetterData } from "@/lib/coverLetterData";

export interface CoverLetterRow {
  id: string;
  name: string;
  data: CoverLetterData;
  shareToken: string | null;
  shareTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CoverLetterSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}
