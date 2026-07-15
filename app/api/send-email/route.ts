/**
 * Emails a generated resume/cover-letter PDF to an address the visitor
 * types in. The PDF itself is generated client-side (same
 * `@react-pdf/renderer` path as `DownloadButton`) and posted here as base64
 * so this route only has to hand it to Resend as an attachment.
 */
import { Resend } from "resend";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "QuickResumeBuilder.com <onboarding@lukasbujdos.com>",
      to: to.trim(),
      subject: `Your ${safeFileName}.pdf from QuickResumeBuilder.com`,
      text: `Thanks for using QuickResumeBuilder.com!\n\nYour ${safeFileName}.pdf is attached to this email. We hope it helps you land your next opportunity.\n\nGood luck with your application!\n— The QuickResumeBuilder.com team`,
      html: `<p>Thanks for using <strong>QuickResumeBuilder.com</strong>!</p><p>Your <strong>${escapeHtml(safeFileName)}.pdf</strong> is attached to this email. We hope it helps you land your next opportunity.</p><p>Good luck with your application!<br>— The QuickResumeBuilder.com team</p>`,
      attachments: [{ filename: `${safeFileName}.pdf`, content: pdfBuffer }],
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to send email." }, { status: 502 });
  }
}
