import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";

export function requestAccountExport(locale: string): Promise<Response> {
  return fetch("/api/account/export", {
    headers: { [API_LOCALE_HEADER]: locale },
  });
}

export function requestAccountDelete(locale: string): Promise<Response> {
  return fetch("/api/account/delete", {
    method: "POST",
    headers: { [API_LOCALE_HEADER]: locale },
  });
}
