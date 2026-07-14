"use client";

/**
 * Download button for the cover letter builder — the cover letter
 * counterpart of `components/DownloadButton.tsx`, simplified since there's
 * only one PDF template (no registry lookup by templateId needed).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "@/components/Icons";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import CoverLetterPdfTemplate, {
  type CoverLetterPdfTemplateProps,
} from "@/components/pdf/CoverLetterPdfTemplate";

export interface CoverLetterDownloadButtonProps
  extends CoverLetterPdfTemplateProps {
  fileName: string;
  className?: string;
}

export default function CoverLetterDownloadButton({
  fileName,
  className,
  ...pdfProps
}: CoverLetterDownloadButtonProps) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      registerPdfFonts();
      const blob = await pdf(<CoverLetterPdfTemplate {...pdfProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName || "cover-letter"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={isGeneratingPdf}
      onClick={handleDownloadPdf}
    >
      {isGeneratingPdf ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        <>
          <DownloadIcon className="h-5 w-5 stroke-current" />
          {t("buttons.download")}
        </>
      )}
    </button>
  );
}
