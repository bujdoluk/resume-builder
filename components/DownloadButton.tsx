"use client";

/**
 * Generic download button: generates a PDF client-side via
 * `@react-pdf/renderer` (dynamically imported so its ~1MB doesn't bloat the
 * initial editor bundle) from whatever `pdfTemplate` component and
 * `pdfProps` the caller supplies, then triggers a browser download of the
 * resulting blob. Reused by both the resume editor (which looks up the
 * right template from `pdfTemplates[templateId]`, since it has several
 * swappable templates) and the cover letter builder (which has only one
 * template and just passes it directly) — the generic type parameter lets
 * each caller's own props shape (`PdfTemplateProps` vs
 * `CoverLetterPdfTemplateProps`) flow through untouched.
 */
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "@/components/Icons";
import { registerPdfFonts } from "@/lib/pdf/fonts";

export interface DownloadButtonProps<T extends object> {
  pdfTemplate: ComponentType<T>;
  pdfProps: T;
  fileName: string;
  className?: string;
}

export default function DownloadButton<T extends object>({
  pdfTemplate: PdfTemplate,
  pdfProps,
  fileName,
  className,
}: DownloadButtonProps<T>) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      registerPdfFonts();
      const blob = await pdf(<PdfTemplate {...pdfProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
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
