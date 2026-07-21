
export interface CoverLetterData {

  senderName: string;
  senderAddress: string;
  senderEmail: string;
  senderPhone: string;

  date: string;

  recipientName: string;
  recipientCompany: string;
  recipientState: string;
  recipientZipCode: string;
  recipientPhone: string;
  recipientEmail: string;

  subject: string;

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
