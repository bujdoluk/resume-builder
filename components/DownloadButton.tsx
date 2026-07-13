"use client";

/**
 * Download button: generates the resume PDF client-side via
 * `@react-pdf/renderer` (dynamically imported so its ~1MB doesn't bloat the
 * initial editor bundle) using the template matching `templateId`, then
 * triggers a browser download of the resulting blob.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "@/components/Icons";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { pdfTemplates, type PdfTemplateProps } from "@/lib/pdf/templates";
import type { TemplateId } from "@/lib/templates";

export interface DownloadButtonProps extends PdfTemplateProps {
  templateId: TemplateId;
  resumeName: string;
  className?: string;
}

export default function DownloadButton({
  templateId,
  resumeName,
  className,
  ...pdfProps
}: DownloadButtonProps) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      registerPdfFonts();
      const PdfTemplate = pdfTemplates[templateId];
      const blob = await pdf(<PdfTemplate {...pdfProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeName || "resume"}.pdf`;
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
