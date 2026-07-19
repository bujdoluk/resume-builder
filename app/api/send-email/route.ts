/**
 * Emails a generated resume/cover-letter PDF, Word document, or plain-text
 * file to an address the visitor types in. The file itself is generated
 * client-side (same `@react-pdf/renderer`/`docx`/`generate*Text` path as
 * `DownloadButton`) and posted here as base64 (PDF/Word) or a raw string
 * (text) so this route only has to hand it to Resend as an attachment. The
 * actual sends live in lib/email/sendPdfEmail.ts, lib/email/sendDocxEmail.ts,
 * and lib/email/sendTextEmail.ts, alongside this app's other transactional
 * email (lib/email/sendWelcomeEmail.ts).
 */
import { sendDocxEmail } from "@/lib/email/sendDocxEmail";
import { sendPdfEmail } from "@/lib/email/sendPdfEmail";
import { sendTextEmail } from "@/lib/email/sendTextEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Bounds both binary attachment types (PDF and Word) identically.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;

export async function POST(request: Request) {
  const { to, fileName, format, pdfBase64, docxBase64, textContent } = await request.json();

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

  if (format === "docx") {
    if (typeof docxBase64 !== "string" || !docxBase64) {
      return Response.json({ error: "Missing Word document data." }, { status: 400 });
    }

    const docxBuffer = Buffer.from(docxBase64, "base64");
    if (docxBuffer.byteLength === 0 || docxBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
      return Response.json({ error: "Invalid Word document data." }, { status: 400 });
    }

    const { error } = await sendDocxEmail({ to: to.trim(), fileName: safeFileName, docxBuffer });
    if (error) {
      return Response.json({ error }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  if (typeof pdfBase64 !== "string" || !pdfBase64) {
    return Response.json({ error: "Missing PDF data." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
    return Response.json({ error: "Invalid PDF data." }, { status: 400 });
  }

  const { error } = await sendPdfEmail({ to: to.trim(), fileName: safeFileName, pdfBuffer });
  if (error) {
    return Response.json({ error }, { status: 502 });
  }
  return Response.json({ ok: true });
}
