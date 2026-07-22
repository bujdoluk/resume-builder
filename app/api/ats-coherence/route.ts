
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { checkCoherence } from "@/lib/atsChecker/checkCoherence";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  MAX_COHERENCE_CHECK_TEXT_LENGTH,
  RATE_LIMIT_ATS_COHERENCE_REQUESTS,
  RATE_LIMIT_ATS_COHERENCE_WINDOW,
} from "@/lib/constants";
import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const allowed = await checkRateLimit(
    "ats-coherence",
    getRequestIp(request),
    RATE_LIMIT_ATS_COHERENCE_REQUESTS,
    RATE_LIMIT_ATS_COHERENCE_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const { captchaToken, documentText } = await request.json();

  if (!(await verifyCaptchaToken(captchaToken))) {
    return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  }

  if (
    typeof documentText !== "string" ||
    !documentText.trim() ||
    documentText.length > MAX_COHERENCE_CHECK_TEXT_LENGTH
  ) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidTextData", request);
  }

  if (!process.env.GROQ_API_KEY) {
    return errorResponse(HTTP_BAD_GATEWAY, "coherenceCheckUnavailable", request);
  }

  try {
    const result = await checkCoherence(documentText);
    return Response.json(result);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return errorResponse(HTTP_BAD_GATEWAY, "coherenceCheckFailed", request);
  }
}
