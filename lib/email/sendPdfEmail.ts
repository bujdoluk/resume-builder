
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";

export interface SendPdfEmailParams {
  to: string;
  fileName: string;
  pdfBuffer: Buffer;
}

export async function sendPdfEmail({
  to,
  fileName,
  pdfBuffer,
}: SendPdfEmailParams): Promise<{ error: string | null }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your ${fileName}.pdf from QuickResumeBuilder.online`,
      text: `Thanks for using QuickResumeBuilder.online!\n\nYour ${fileName}.pdf is attached to this email. We hope it helps you land your next opportunity.\n\nGood luck with your application!\n— The QuickResumeBuilder.online team`,
      html: `<p>Thanks for using <strong>QuickResumeBuilder.online</strong>!</p><p>Your <strong>${escapeHtml(fileName)}.pdf</strong> is attached to this email. We hope it helps you land your next opportunity.</p><p>Good luck with your application!<br>— The QuickResumeBuilder.online team</p>`,
      attachments: [{ filename: `${fileName}.pdf`, content: pdfBuffer }],
    });

    return { error: error?.message ?? null };
  } catch {
    return { error: "Failed to send email." };
  }
}
