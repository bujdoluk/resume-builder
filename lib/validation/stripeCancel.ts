import { z } from "zod";

export const stripeCancelBodySchema = z.object({
  action: z.enum(["cancel", "resume"], "invalidAction"),
});
