
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { rewriteText, type RewriteStyle } from "@/lib/aiRewrite/rewriteText";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  MAX_AI_REWRITE_TEXT_LENGTH,
  RATE_LIMIT_AI_REWRITE_REQUESTS,
  RATE_LIMIT_AI_REWRITE_WINDOW,
} from "@/lib/constants";
import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";

const VALID_STYLES: RewriteStyle[] = ["bullets", "paragraph"];

export async function POST(request: Request) {
  const allowed = await checkRateLimit(
    "ai-rewrite",
    getRequestIp(request),
    RATE_LIMIT_AI_REWRITE_REQUESTS,
    RATE_LIMIT_AI_REWRITE_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const { captchaToken, text, style } = await request.json();

  if (!(await verifyCaptchaToken(captchaToken))) {
    return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  }

  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > MAX_AI_REWRITE_TEXT_LENGTH
  ) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidTextData", request);
  }

  if (!VALID_STYLES.includes(style)) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidInput", request);
  }

  if (!process.env.GROQ_API_KEY) {
    return errorResponse(HTTP_BAD_GATEWAY, "aiRewriteUnavailable", request);
  }

  try {
    const rewritten = await rewriteText(text, style);
    return Response.json({ rewritten });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return errorResponse(HTTP_BAD_GATEWAY, "aiRewriteFailed", request);
  }
}
