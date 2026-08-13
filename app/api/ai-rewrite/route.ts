
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import { rewriteText } from "@/lib/aiRewrite/rewriteText";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  RATE_LIMIT_AI_REWRITE_REQUESTS,
  RATE_LIMIT_AI_REWRITE_WINDOW,
} from "@/lib/constants";
// import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import { aiRewriteBodySchema } from "@/lib/validation/aiRewrite";

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

  const body = await request.json().catch(() => null);
  // const { captchaToken } = body ?? {};

  // if (!(await verifyCaptchaToken(captchaToken))) {
  //   return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  // }

  const parsed = validateBody(aiRewriteBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { text, style } = parsed.data;

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
