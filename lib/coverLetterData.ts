import { z } from "zod";
import { createVersionedCodec } from "@/lib/schemaVersion";

export const coverLetterDataSchema = z.object({
  senderName: z.string().catch(""),
  senderAddress: z.string().catch(""),
  senderEmail: z.string().catch(""),
  senderPhone: z.string().catch(""),

  date: z.string().catch(""),

  recipientName: z.string().catch(""),
  recipientCompany: z.string().catch(""),
  recipientState: z.string().catch(""),
  recipientZipCode: z.string().catch(""),
  recipientPhone: z.string().catch(""),
  recipientEmail: z.string().catch(""),

  subject: z.string().catch(""),

  greeting: z.string().catch(""),
  body: z.string().catch(""),
  closing: z.string().catch(""),

  customFieldValue: z.string().catch(""),
  customFieldsTitle: z.string().catch(""),
});
export type CoverLetterData = z.infer<typeof coverLetterDataSchema>;

export const emptyCoverLetterData: CoverLetterData = coverLetterDataSchema.parse({});

export const COVER_LETTER_SCHEMA_VERSION = 1;

// See RESUME_SCHEMA_VERSION in lib/resumeData.ts for the full contract —
// same scaffold, nothing to migrate yet since this is the first version.
const coverLetterMigrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

const coverLetterCodec = createVersionedCodec<CoverLetterData>(
  COVER_LETTER_SCHEMA_VERSION,
  coverLetterMigrations,
);

/** Stamps the current schema version onto data about to be persisted. */
export function stampCoverLetterData(data: CoverLetterData): Record<string, unknown> {
  return coverLetterCodec.stamp(data);
}

/**
 * Runs pending migrations against raw storage input, then validates the
 * result — see parseStoredResumeData in lib/resumeData.ts for why this
 * replaces a plain `{ ...emptyCoverLetterData, ...row.data }` spread.
 */
export function parseStoredCoverLetterData(raw: unknown): CoverLetterData {
  return coverLetterDataSchema.parse(coverLetterCodec.migrate(raw));
}
