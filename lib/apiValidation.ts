import type { ZodType } from "zod";
import type { ApiErrorKey } from "@/lib/apiErrors";

export type ValidationResult<T> = { success: true; data: T } | { success: false; key: ApiErrorKey };

export function validateBody<T>(schema: ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const key = (result.error.issues[0]?.message ?? "invalidInput") as ApiErrorKey;
  return { success: false, key };
}
