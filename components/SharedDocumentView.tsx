"use client";

import { useTranslation } from "react-i18next";

export interface SharedDocumentViewProps {
  title: string;
  pdfUrl: string;
  downloadFileName: string;
}

// Client Component so useTranslation() has the full React runtime available
// — importing the i18n singleton (or using the hook) directly from the
// Server Component page that renders this breaks the build, since
// initReactI18next touches client-only React APIs (createContext) at
// import time, and Server Component pages are bundled against a restricted
// server-only React that doesn't have them.
export default function SharedDocumentView({
  title,
  pdfUrl,
  downloadFileName,
}: SharedDocumentViewProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-base-200 flex flex-1 flex-col items-center gap-4 p-4 md:p-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <a href={pdfUrl} download={downloadFileName} className="btn btn-primary btn-sm">
          {t("share.downloadPdf")}
        </a>
      </div>
      <embed
        src={pdfUrl}
        type="application/pdf"
        className="h-[80vh] w-full max-w-3xl rounded-lg border shadow-sm"
      />
    </div>
  );
}
