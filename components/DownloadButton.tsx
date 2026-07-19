"use client";

/**
 * Generic download button: generates either a PDF (via `@react-pdf/renderer`,
 * dynamically imported so its ~1MB doesn't bloat the initial editor bundle)
 * or a plain-text file — depending on `format` — from whatever
 * `pdfTemplate`/`pdfProps`/`textContent` the caller supplies, then triggers
 * a browser download of the result. Reused by both the resume editor (which
 * looks up the right template from `pdfTemplates[templateId]`, since it has
 * several swappable templates) and the cover letter builder (which has only
 * one template and just passes it directly) — the generic type parameter
 * lets each caller's own PDF props shape (`PdfTemplateProps` vs
 * `CoverLetterPdfTemplateProps`) flow through untouched.
 */
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "@/components/Icons";
import type { ExportFormat } from "@/lib/exportFormat";
import { registerPdfFonts } from "@/lib/pdf/fonts";

export interface DownloadButtonProps<T extends object> {
  pdfTemplate: ComponentType<T>;
  pdfProps: T;
  format: ExportFormat;
  textContent: string;
  fileName: string;
  className?: string;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DownloadButton<T extends object>({
  pdfTemplate: PdfTemplate,
  pdfProps,
  format,
  textContent,
  fileName,
  className,
}: DownloadButtonProps<T>) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      if (format === "txt") {
        downloadBlob(
          new Blob([textContent], { type: "text/plain;charset=utf-8" }),
          `${fileName}.txt`,
        );
        return;
      }

      const { pdf } = await import("@react-pdf/renderer");
      registerPdfFonts();
      const blob = await pdf(<PdfTemplate {...pdfProps} />).toBlob();
      downloadBlob(blob, `${fileName}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={isGenerating}
      onClick={handleDownload}
    >
      {isGenerating ? (
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
