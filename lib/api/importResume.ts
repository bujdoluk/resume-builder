import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { ImportFileType } from "@/types/resume";

export interface ImportResumeParams {
  captchaToken?: string;
  fileBase64: string;
  fileType: ImportFileType;
}

export function requestResumeImport(params: ImportResumeParams, locale: string): Promise<Response> {
  return fetch("/api/import-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
