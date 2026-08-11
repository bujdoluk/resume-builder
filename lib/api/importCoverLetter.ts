import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { ImportFileType } from "@/types/documentImport";

export interface ImportCoverLetterParams {
  captchaToken?: string;
  fileBase64: string;
  fileType: ImportFileType;
}

export function requestCoverLetterImport(params: ImportCoverLetterParams, locale: string): Promise<Response> {
  return fetch("/api/import-cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
