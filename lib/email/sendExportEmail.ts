
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";

export interface SendExportEmailParams {
  to: string;
  fileName: string;
  extension: "pdf" | "docx" | "txt";
  content: Buffer;
}

export async function sendExportEmail({
  to,
  fileName,
  extension,
  content,
}: SendExportEmailParams): Promise<{ error: string | null }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your ${fileName}.${extension} from QuickResumeBuilder.online`,
      text: `Thanks for using QuickResumeBuilder.online!\n\nYour ${fileName}.${extension} is attached to this email. We hope it helps you land your next opportunity.\n\nGood luck with your application!\n— The QuickResumeBuilder.online team`,
      html: `<p>Thanks for using <strong>QuickResumeBuilder.online</strong>!</p><p>Your <strong>${escapeHtml(fileName)}.${extension}</strong> is attached to this email. We hope it helps you land your next opportunity.</p><p>Good luck with your application!<br>— The QuickResumeBuilder.online team</p>`,
      attachments: [{ filename: `${fileName}.${extension}`, content }],
    });

    return { error: error?.message ?? null };
  } catch {
    return { error: "Failed to send email." };
  }
}
