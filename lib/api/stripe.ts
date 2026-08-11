import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";

export type StripePlan = "monthly" | "annual";
export type StripeCancelAction = "cancel" | "resume";

export function requestStripeCheckout(plan: StripePlan, locale: string): Promise<Response> {
  return fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify({ plan }),
  });
}

export function requestStripeCancel(action: StripeCancelAction, locale: string): Promise<Response> {
  return fetch("/api/stripe/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify({ action }),
  });
}
