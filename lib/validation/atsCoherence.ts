import { z } from "zod";
import { MAX_COHERENCE_CHECK_TEXT_LENGTH } from "@/lib/constants";

export const atsCoherenceBodySchema = z.object({
  documentText: z
    .string("invalidTextData")
    .max(MAX_COHERENCE_CHECK_TEXT_LENGTH, "invalidTextData")
    .refine((value) => value.trim().length > 0, "invalidTextData"),
});
