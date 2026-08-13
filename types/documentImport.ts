export type ImportFileType = "pdf" | "docx";

export interface ImportDocumentParams {
  captchaToken?: string;
  fileBase64: string;
  fileType: ImportFileType;
}

export interface ImportDialogHandle<T> {
  open: () => Promise<T | null>;
}
