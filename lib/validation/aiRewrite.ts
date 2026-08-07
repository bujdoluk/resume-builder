import { z } from "zod";
import type { RewriteStyle } from "@/lib/aiRewrite/rewriteText";
import { MAX_AI_REWRITE_TEXT_LENGTH } from "@/lib/constants";

const REWRITE_STYLES = ["bullets", "paragraph"] as const satisfies readonly RewriteStyle[];

export const aiRewriteBodySchema = z.object({
  text: z
    .string("invalidTextData")
    .max(MAX_AI_REWRITE_TEXT_LENGTH, "invalidTextData")
    .refine((value) => value.trim().length > 0, "invalidTextData"),
  style: z.enum(REWRITE_STYLES, "invalidInput"),
});
