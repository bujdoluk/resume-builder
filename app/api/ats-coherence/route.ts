
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import { checkCoherence } from "@/lib/atsChecker/checkCoherence";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  RATE_LIMIT_ATS_COHERENCE_REQUESTS,
  RATE_LIMIT_ATS_COHERENCE_WINDOW,
} from "@/lib/constants";
// import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import { atsCoherenceBodySchema } from "@/lib/validation/atsCoherence";

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

  const body = await request.json().catch(() => null);
  // const { captchaToken } = body ?? {};

  // if (!(await verifyCaptchaToken(captchaToken))) {
  //   return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  // }

  const parsed = validateBody(atsCoherenceBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { documentText } = parsed.data;

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
