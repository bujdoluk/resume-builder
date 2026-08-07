import { z } from "zod";

export const stripeCheckoutBodySchema = z.object({
  plan: z.enum(["monthly", "annual"], "invalidPlan"),
});
