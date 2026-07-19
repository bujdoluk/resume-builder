"use client";

/**
 * Generic email button: opens a dialog asking for a recipient address, then
 * generates either the same client-side PDF as `DownloadButton` or the
 * caller-supplied plain-text content — depending on `format` — and posts it
 * to `/api/send-email`, which relays it through Resend as an attachment.
 * Reused by both the resume editor and the cover letter builder, same as
 * `DownloadButton`.
 */
import { useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { EmailIcon } from "@/components/Icons";
import type { ExportFormat } from "@/lib/exportFormat";
import { registerPdfFonts } from "@/lib/pdf/fonts";

export interface EmailButtonProps<T extends object> {
  pdfTemplate: ComponentType<T>;
  pdfProps: T;
  format: ExportFormat;
  textContent: string;
  fileName: string;
  className?: string;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export default function EmailButton<T extends object>({
  pdfTemplate: PdfTemplate,
  pdfProps,
  format,
  textContent,
  fileName,
  className,
}: EmailButtonProps<T>) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [to, setTo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function openDialog() {
    setError(null);
    setSent(false);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const body: Record<string, string> = { to, fileName, format };

      if (format === "txt") {
        body.textContent = textContent;
      } else {
        const { pdf } = await import("@react-pdf/renderer");
        registerPdfFonts();
        const blob = await pdf(<PdfTemplate {...pdfProps} />).toBlob();
        body.pdfBase64 = await blobToBase64(blob);
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || t("emailDialog.sendFailed"));
      }

      setSent(true);
      setTo("");
      setTimeout(closeDialog, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("emailDialog.sendFailed"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={openDialog}
      >
        <EmailIcon className="h-5 w-5 stroke-current" />
        {t("buttons.email")}
      </button>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">{t("emailDialog.title")}</h3>
          <p className="text-sm opacity-70 mt-1">{t("emailDialog.description")}</p>
          <form onSubmit={handleSubmit}>
            <fieldset className="fieldset mt-4">
              <input
                type="email"
                required
                className="input input-bordered w-full"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder={t("emailDialog.placeholder")}
                autoFocus
              />
              {error && <p className="text-error mt-1 text-sm">{error}</p>}
              {sent && (
                <p className="text-success mt-1 text-sm">{t("emailDialog.sent")}</p>
              )}
            </fieldset>
            <div className="modal-action">
              <button type="button" className="btn" onClick={closeDialog}>
                {t("buttons.cancel")}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSending}>
                {isSending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  t("emailDialog.send")
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeDialog}>close</button>
        </form>
      </dialog>
    </>
  );
}
