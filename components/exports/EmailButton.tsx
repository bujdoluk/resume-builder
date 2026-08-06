"use client";

import { useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { EmailIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import type { ExportFormat } from "@/lib/exportFormat";
import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import { handleApiResponse } from "@/lib/apiResponse";
import { EMAIL_SENT_DIALOG_CLOSE_DELAY_MS } from "@/lib/constants";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

export interface EmailButtonProps<T extends object> {
  pdfTemplate: ComponentType<T>;
  pdfProps: T;
  format: ExportFormat;
  textContent: string;
  buildDocxBlob: () => Promise<Blob>;
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
  buildDocxBlob,
  fileName,
  className,
}: EmailButtonProps<T>) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [to, setTo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  function openDialog() {
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
    try {
      const captchaToken = await getAnonymousCaptchaToken();
      const body: Record<string, string> = { to, fileName, format };
      if (captchaToken) body.captchaToken = captchaToken;

      if (format === "txt") {
        body.textContent = textContent;
      } else if (format === "docx") {
        body.docxBase64 = await blobToBase64(await buildDocxBlob());
      } else {
        const { pdf } = await import("@react-pdf/renderer");
        registerPdfFonts();
        const blob = await pdf(<PdfTemplate {...pdfProps} />).toBlob();
        body.pdfBase64 = await blobToBase64(blob);
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: i18n.language },
        body: JSON.stringify(body),
      });

      const result = await handleApiResponse(response, showToast, t);
      if (!result) return;

      setSent(true);
      setTo("");
      setTimeout(closeDialog, EMAIL_SENT_DIALOG_CLOSE_DELAY_MS);
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
