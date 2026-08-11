import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { ExportFormat } from "@/lib/exportFormat";

export interface SendEmailParams {
  to: string;
  fileName: string;
  format: ExportFormat;
  captchaToken?: string;
  textContent?: string;
  docxBase64?: string;
  pdfBase64?: string;
}

export function requestSendEmail(params: SendEmailParams, locale: string): Promise<Response> {
  return fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
