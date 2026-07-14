/**
 * Cover letter data model: a single flat shape grouped into five sections
 * (sender info, date, recipient info, subject, letter body) — unlike the
 * resume, there's only one template and no repeatable entries, so this
 * stays intentionally simple.
 */
export interface CoverLetterData {
  // Section 1: sender info
  senderName: string;
  senderAddress: string;
  senderEmail: string;
  senderPhone: string;
  // Section 2: date
  date: string;
  // Section 3: recipient info
  recipientName: string;
  recipientCompany: string;
  recipientState: string;
  recipientZipCode: string;
  recipientPhone: string;
  recipientEmail: string;
  // Section 4: subject
  subject: string;
  // Section 5: letter (greeting, body, closing, signature)
  greeting: string;
  body: string;
  closing: string;
}

export const emptyCoverLetterData: CoverLetterData = {
  senderName: "",
  senderAddress: "",
  senderEmail: "",
  senderPhone: "",
  date: "",
  recipientName: "",
  recipientCompany: "",
  recipientState: "",
  recipientZipCode: "",
  recipientPhone: "",
  recipientEmail: "",
  subject: "",
  greeting: "",
  body: "",
  closing: "",
};
