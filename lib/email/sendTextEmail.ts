/**
 * Emails a generated resume/cover-letter plain-text file as an attachment —
 * the .txt sibling of `lib/email/sendPdfEmail.ts`, used by
 * app/api/send-email/route.ts, which owns input validation before calling
 * this.
 */
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";

export interface SendTextEmailParams {
  to: string;
  fileName: string;
  textContent: string;
}

export async function sendTextEmail({
  to,
  fileName,
  textContent,
}: SendTextEmailParams): Promise<{ error: string | null }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your ${fileName}.txt from QuickResumeBuilder.online`,
      text: `Thanks for using QuickResumeBuilder.online!\n\nYour ${fileName}.txt is attached to this email. We hope it helps you land your next opportunity.\n\nGood luck with your application!\n— The QuickResumeBuilder.online team`,
      html: `<p>Thanks for using <strong>QuickResumeBuilder.online</strong>!</p><p>Your <strong>${escapeHtml(fileName)}.txt</strong> is attached to this email. We hope it helps you land your next opportunity.</p><p>Good luck with your application!<br>— The QuickResumeBuilder.online team</p>`,
      attachments: [
        { filename: `${fileName}.txt`, content: Buffer.from(textContent, "utf-8") },
      ],
    });

    return { error: error?.message ?? null };
  } catch {
    return { error: "Failed to send email." };
  }
}
