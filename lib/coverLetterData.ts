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

const coverLetterMigrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

const coverLetterCodec = createVersionedCodec<CoverLetterData>(
  COVER_LETTER_SCHEMA_VERSION,
  coverLetterMigrations,
);

export function stampCoverLetterData(data: CoverLetterData): Record<string, unknown> {
  return coverLetterCodec.stamp(data);
}

export function parseStoredCoverLetterData(raw: unknown): CoverLetterData {
  return coverLetterDataSchema.parse(coverLetterCodec.migrate(raw));
}
