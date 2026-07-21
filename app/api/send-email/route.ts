
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_BAD_GATEWAY, HTTP_BAD_REQUEST, MAX_ATTACHMENT_BYTES, MAX_TEXT_LENGTH } from "@/lib/constants";
import { verifyCaptchaToken } from "@/lib/hcaptcha";
import { sendDocxEmail } from "@/lib/email/sendDocxEmail";
import { sendPdfEmail } from "@/lib/email/sendPdfEmail";
import { sendTextEmail } from "@/lib/email/sendTextEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { to, fileName, format, pdfBase64, docxBase64, textContent, captchaToken } =
    await request.json();

  if (!(await verifyCaptchaToken(captchaToken))) {
    return errorResponse(HTTP_BAD_REQUEST, "captchaVerificationFailed", request);
  }

  if (typeof to !== "string" || !EMAIL_PATTERN.test(to.trim())) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidEmailAddress", request);
  }

  const safeFileName =
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim().replace(/[/\\]/g, "-")
      : "document";

  if (format === "txt") {
    if (typeof textContent !== "string" || !textContent || textContent.length > MAX_TEXT_LENGTH) {
      return errorResponse(HTTP_BAD_REQUEST, "invalidTextData", request);
    }

    const { error } = await sendTextEmail({ to: to.trim(), fileName: safeFileName, textContent });
    if (error) {
      return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
    }
    return Response.json({ ok: true });
  }

  if (format === "docx") {
    if (typeof docxBase64 !== "string" || !docxBase64) {
      return errorResponse(HTTP_BAD_REQUEST, "missingWordData", request);
    }

    const docxBuffer = Buffer.from(docxBase64, "base64");
    if (docxBuffer.byteLength === 0 || docxBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
      return errorResponse(HTTP_BAD_REQUEST, "invalidWordData", request);
    }

    const { error } = await sendDocxEmail({ to: to.trim(), fileName: safeFileName, docxBuffer });
    if (error) {
      return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
    }
    return Response.json({ ok: true });
  }

  if (typeof pdfBase64 !== "string" || !pdfBase64) {
    return errorResponse(HTTP_BAD_REQUEST, "missingPdfData", request);
  }

  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
    return errorResponse(HTTP_BAD_REQUEST, "invalidPdfData", request);
  }

  const { error } = await sendPdfEmail({ to: to.trim(), fileName: safeFileName, pdfBuffer });
  if (error) {
    return Response.json({ error }, { status: HTTP_BAD_GATEWAY });
  }
  return Response.json({ ok: true });
}
