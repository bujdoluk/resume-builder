"use client";

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
  buildDocxBlob: () => Promise<Blob>;
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
  buildDocxBlob,
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

      if (format === "docx") {
        downloadBlob(await buildDocxBlob(), `${fileName}.docx`);
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
