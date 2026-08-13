import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { ImportDocumentParams } from "@/types/documentImport";

export function requestCoverLetterImport(params: ImportDocumentParams, locale: string): Promise<Response> {
  return fetch("/api/import-cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
