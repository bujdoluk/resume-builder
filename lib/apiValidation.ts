import type { ZodType } from "zod";
import type { ApiErrorKey } from "@/lib/apiErrors";

export type ValidationResult<T> = { success: true; data: T } | { success: false; key: ApiErrorKey };

/**
 * Runs a Zod schema against parsed request data and maps a failure straight
 * to the ApiErrorKey set as that field's schema message (see lib/validation/*),
 * so callers don't have to re-derive which error key a shape mismatch means.
 */
export function validateBody<T>(schema: ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const key = (result.error.issues[0]?.message ?? "invalidInput") as ApiErrorKey;
  return { success: false, key };
}
