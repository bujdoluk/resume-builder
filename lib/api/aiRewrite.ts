import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { RewriteStyle } from "@/lib/aiRewrite/rewriteText";

export interface AiRewriteParams {
  captchaToken?: string;
  text: string;
  style: RewriteStyle;
}

export function requestAiRewrite(params: AiRewriteParams, locale: string): Promise<Response> {
  return fetch("/api/ai-rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(params),
  });
}
