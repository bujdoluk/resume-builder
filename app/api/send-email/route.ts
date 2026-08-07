
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  MAX_ATTACHMENT_BYTES,
  RATE_LIMIT_SEND_EMAIL_REQUESTS,
  RATE_LIMIT_SEND_EMAIL_WINDOW,
} from "@/lib/constants";
import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { sendDocxEmail } from "@/lib/email/sendDocxEmail";
import { sendPdfEmail } from "@/lib/email/sendPdfEmail";
import { sendTextEmail } from "@/lib/email/sendTextEmail";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import {
  docxBase64Schema,
  pdfBase64Schema,
  sendEmailBaseSchema,
  textContentSchema,
} from "@/lib/validation/sendEmail";

export async function POST(request: Request) {
  const allowed = await checkRateLimit(
    "send-email",
    getRequestIp(request),
    RATE_LIMIT_SEND_EMAIL_REQUESTS,
    RATE_LIMIT_SEND_EMAIL_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const body = await request.json().catch(() => null);
  const { format, pdfBase64, docxBase64, textContent, captchaToken } = body ?? {};

  if (!(await verifyCaptchaToken(captchaToken))) {
    return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  }

  const parsed = validateBody(sendEmailBaseSchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { to, fileName } = parsed.data;

  const safeFileName = fileName ? fileName.replace(/[/\\]/g, "-") : "document";

  if (format === "txt") {
    const parsedText = validateBody(textContentSchema, textContent);
    if (!parsedText.success) {
      return errorResponse(HTTP_BAD_REQUEST, parsedText.key, request);
    }

    const { error } = await sendTextEmail({
      to,
      fileName: safeFileName,
      textContent: parsedText.data,
    });
    if (error) {
      return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
    }
    return Response.json({ ok: true });
  }

  if (format === "docx") {
    const parsedDocx = validateBody(docxBase64Schema, docxBase64);
    if (!parsedDocx.success) {
      return errorResponse(HTTP_BAD_REQUEST, parsedDocx.key, request);
    }

    const docxBuffer = Buffer.from(parsedDocx.data, "base64");
    if (docxBuffer.byteLength === 0 || docxBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
      return errorResponse(HTTP_BAD_REQUEST, "invalidWordData", request);
    }

    const { error } = await sendDocxEmail({ to, fileName: safeFileName, docxBuffer });
    if (error) {
      return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
    }
    return Response.json({ ok: true });
  }

  const parsedPdf = validateBody(pdfBase64Schema, pdfBase64);
  if (!parsedPdf.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsedPdf.key, request);
  }

  const pdfBuffer = Buffer.from(parsedPdf.data, "base64");
  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidPdfData", request);
  }

  const { error } = await sendPdfEmail({ to, fileName: safeFileName, pdfBuffer });
  if (error) {
    return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
  }
  return Response.json({ ok: true });
}
