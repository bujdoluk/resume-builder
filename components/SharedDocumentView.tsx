"use client";

import { useEffect, useRef, useState } from "react";
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
//
// Renders the PDF with pdfjs-dist directly to <canvas> elements rather than
// an <embed type="application/pdf">, since most mobile browsers (Chrome
// Mobile, Safari iOS) don't support inline PDF embeds at all and just show
// a blank box — canvas rendering works the same everywhere.
export default function SharedDocumentView({
  title,
  pdfUrl,
  downloadFileName,
}: SharedDocumentViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    async function renderPdf() {
      if (!container) return;
      setStatus("loading");

      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Loaded as a plain static asset (copied into public/ by
        // scripts/copy-pdf-worker.mjs at install time) rather than via
        // `new Worker(new URL(...))` — that pattern needs bundler-specific
        // rewriting that only works when the `new Worker()` call itself is
        // visible at the call site, not buried inside a third-party
        // package's own internals.
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const doc = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        if (cancelled || !container) return;

        container.replaceChildren();
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const page = await doc.getPage(pageNumber);
          if (cancelled || !container) return;

          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = (container.clientWidth || 800) / unscaledViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "w-full rounded-lg border shadow-sm";
          container.appendChild(canvas);

          await page.render({ canvas, viewport }).promise;
        }

        if (!cancelled) setStatus("ready");
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus("error");
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  return (
    <div className="bg-base-200 flex flex-1 flex-col items-center gap-4 p-4 md:p-8">
      <div className="flex w-full max-w-xl flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <a href={pdfUrl} download={downloadFileName} className="btn btn-primary btn-sm">
          {t("share.downloadPdf")}
        </a>
      </div>

      {status === "loading" && <span className="loading loading-spinner loading-lg" />}
      {status === "error" && (
        <p className="text-base-content/70 max-w-xl text-center text-sm">
          {t("share.previewUnavailable")}
        </p>
      )}
      <div
        ref={containerRef}
        className="flex w-full max-w-xl flex-col gap-4 empty:hidden"
      />
    </div>
  );
}
