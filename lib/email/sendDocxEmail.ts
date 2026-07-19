/**
 * Emails a generated resume/cover-letter Word document as an attachment —
 * the .docx sibling of `lib/email/sendPdfEmail.ts` and
 * `lib/email/sendTextEmail.ts`, used by app/api/send-email/route.ts, which
 * owns input validation before calling this.
 */
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";

export interface SendDocxEmailParams {
  to: string;
  fileName: string;
  docxBuffer: Buffer;
}

export async function sendDocxEmail({
  to,
  fileName,
  docxBuffer,
}: SendDocxEmailParams): Promise<{ error: string | null }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your ${fileName}.docx from QuickResumeBuilder.online`,
      text: `Thanks for using QuickResumeBuilder.online!\n\nYour ${fileName}.docx is attached to this email. We hope it helps you land your next opportunity.\n\nGood luck with your application!\n— The QuickResumeBuilder.online team`,
      html: `<p>Thanks for using <strong>QuickResumeBuilder.online</strong>!</p><p>Your <strong>${escapeHtml(fileName)}.docx</strong> is attached to this email. We hope it helps you land your next opportunity.</p><p>Good luck with your application!<br>— The QuickResumeBuilder.online team</p>`,
      attachments: [{ filename: `${fileName}.docx`, content: docxBuffer }],
    });

    return { error: error?.message ?? null };
  } catch {
    return { error: "Failed to send email." };
  }
}
