import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";

export interface AtsCoherenceParams {
  captchaToken?: string;
  documentText: string;
}

export function requestCoherenceCheck(params: AtsCoherenceParams, locale: string): Promise<Response> {
  return fetch("/api/ats-coherence", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
