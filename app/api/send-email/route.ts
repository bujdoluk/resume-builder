/**
 * Emails a generated resume/cover-letter PDF to an address the visitor
 * types in. The PDF itself is generated client-side (same
 * `@react-pdf/renderer` path as `DownloadButton`) and posted here as base64
 * so this route only has to hand it to Resend as an attachment. The actual
 * send lives in lib/email/sendPdfEmail.ts, alongside this app's other
 * transactional email (lib/email/sendWelcomeEmail.ts).
 */
import { sendPdfEmail } from "@/lib/email/sendPdfEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const { to, fileName, pdfBase64 } = await request.json();

  if (typeof to !== "string" || !EMAIL_PATTERN.test(to.trim())) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (typeof pdfBase64 !== "string" || !pdfBase64) {
    return Response.json({ error: "Missing PDF data." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_PDF_BYTES) {
    return Response.json({ error: "Invalid PDF data." }, { status: 400 });
  }

  const safeFileName =
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim().replace(/[/\\]/g, "-")
      : "document";

  const { error } = await sendPdfEmail({ to: to.trim(), fileName: safeFileName, pdfBuffer });
  if (error) {
    return Response.json({ error }, { status: 502 });
  }
  return Response.json({ ok: true });
}
