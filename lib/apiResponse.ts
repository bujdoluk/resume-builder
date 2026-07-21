import type { TFunction } from "i18next";
import type { ToastVariant } from "@/components/Toast";
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_MULTIPLE_CHOICES,
  HTTP_NOT_FOUND,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
} from "@/lib/constants";

export type StatusCategory = "success" | "redirect" | "clientError" | "serverError";

export function categorizeStatus(status: number): StatusCategory {
  if (status < HTTP_MULTIPLE_CHOICES) return "success";
  if (status < HTTP_BAD_REQUEST) return "redirect";
  if (status < HTTP_INTERNAL_SERVER_ERROR) return "clientError";
  return "serverError";
}

export const statusCategoryVariant: Record<StatusCategory, ToastVariant> = {
  success: "success",
  redirect: "info",
  clientError: "warning",
  serverError: "error",
};

const STATUS_MESSAGE_KEYS: Record<number, string> = {
  [HTTP_BAD_REQUEST]: "errors.badRequest",
  [HTTP_UNAUTHORIZED]: "errors.unauthorized",
  [HTTP_FORBIDDEN]: "errors.forbidden",
  [HTTP_NOT_FOUND]: "errors.notFound",
  [HTTP_CONFLICT]: "errors.conflict",
  [HTTP_TOO_MANY_REQUESTS]: "errors.tooManyRequests",
};

export function friendlyMessageForStatus(status: number, t: TFunction): string {
  const key = STATUS_MESSAGE_KEYS[status];
  if (key) return t(key);
  return t(status < HTTP_INTERNAL_SERVER_ERROR ? "errors.genericClient" : "errors.genericServer");
}

export async function handleApiResponse<T = unknown>(
  response: Response,
  showToast: (message: string, variant: ToastVariant) => void,
  t: TFunction,
): Promise<T | null> {
  const category = categorizeStatus(response.status);

  if (category === "clientError" || category === "serverError") {
    const body = await response.json().catch(() => null);
    const message =
      (typeof body?.error === "string" && body.error) || friendlyMessageForStatus(response.status, t);
    showToast(message, statusCategoryVariant[category]);
    return null;
  }

  return response.json().catch(() => null) as Promise<T | null>;
}
