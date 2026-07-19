/**
 * Emails a generated resume/cover-letter PDF or plain-text file to an
 * address the visitor types in. The file itself is generated client-side
 * (same `@react-pdf/renderer`/`generate*Text` path as `DownloadButton`) and
 * posted here as base64 (PDF) or a raw string (text) so this route only has
 * to hand it to Resend as an attachment. The actual sends live in
 * lib/email/sendPdfEmail.ts and lib/email/sendTextEmail.ts, alongside this
 * app's other transactional email (lib/email/sendWelcomeEmail.ts).
 */
import { sendPdfEmail } from "@/lib/email/sendPdfEmail";
import { sendTextEmail } from "@/lib/email/sendTextEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;

export async function POST(request: Request) {
  const { to, fileName, format, pdfBase64, textContent } = await request.json();

  if (typeof to !== "string" || !EMAIL_PATTERN.test(to.trim())) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const safeFileName =
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim().replace(/[/\\]/g, "-")
      : "document";

  if (format === "txt") {
    if (typeof textContent !== "string" || !textContent || textContent.length > MAX_TEXT_LENGTH) {
      return Response.json({ error: "Invalid text data." }, { status: 400 });
    }

    const { error } = await sendTextEmail({ to: to.trim(), fileName: safeFileName, textContent });
    if (error) {
      return Response.json({ error }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  if (typeof pdfBase64 !== "string" || !pdfBase64) {
    return Response.json({ error: "Missing PDF data." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_PDF_BYTES) {
    return Response.json({ error: "Invalid PDF data." }, { status: 400 });
  }

  const { error } = await sendPdfEmail({ to: to.trim(), fileName: safeFileName, pdfBuffer });
  if (error) {
    return Response.json({ error }, { status: 502 });
  }
  return Response.json({ ok: true });
}
