import { z } from "zod";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

export const sendEmailBaseSchema = z.object({
  to: z.string("invalidEmailAddress").trim().pipe(z.email("invalidEmailAddress")),
  fileName: z.string().trim().optional(),
});

export const textContentSchema = z.string("invalidTextData").min(1, "invalidTextData").max(MAX_TEXT_LENGTH, "invalidTextData");
export const docxBase64Schema = z.string("missingWordData").min(1, "missingWordData");
export const pdfBase64Schema = z.string("missingPdfData").min(1, "missingPdfData");
