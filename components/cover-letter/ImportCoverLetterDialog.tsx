"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { requestCoverLetterImport } from "@/lib/api/importCoverLetter";
import { handleApiResponse } from "@/lib/apiResponse";
import type { CoverLetterData } from "@/lib/coverLetterData";
import { isCoverLetterFieldFilled } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  coverLetterSectionStepTitleKey,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/constants";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";
import type { ImportDialogHandle, ImportFileType } from "@/types/documentImport";

export type ImportCoverLetterDialogHandle = ImportDialogHandle<CoverLetterData>;

const ACCEPTED_EXTENSIONS: Record<ImportFileType, string> = {
  pdf: ".pdf",
  docx: ".docx",
};

function fileTypeFor(file: File): ImportFileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unexpected file reader result."));
        return;
      }
      // "data:<mime>;base64,<data>" — the API only wants the payload.
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

// A section counts as "found" if any of its fields came back non-empty —
// unlike resume import, cover letter sections (sender/date/recipient/
// subject/letter) already include the sender's personal info, so there's
// no separate "personal info" badge needed here.
function populatedSections(data: CoverLetterData): CoverLetterSectionKey[] {
  return (Object.keys(coverLetterSectionFieldKeys) as CoverLetterSectionKey[]).filter((section) =>
    coverLetterSectionFieldKeys[section].some((field) => isCoverLetterFieldFilled(field, data)),
  );
}

export default function ImportCoverLetterDialog({ ref }: { ref?: Ref<ImportCoverLetterDialogHandle> }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolveRef = useRef<((data: CoverLetterData | null) => void) | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<CoverLetterData | null>(null);

  useImperativeHandle(ref, () => ({
    open() {
      setSelectedFile(null);
      setIsImporting(false);
      setImportedData(null);
      dialogRef.current?.showModal();
      return new Promise<CoverLetterData | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  function finish(data: CoverLetterData | null) {
    dialogRef.current?.close();
    resolveRef.current?.(data);
    resolveRef.current = null;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!fileTypeFor(file)) {
      showToast(t("importCoverLetter.unsupportedFileType"), "warning");
      return;
    }
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      showToast(t("importCoverLetter.fileTooLarge"), "warning");
      return;
    }
    setSelectedFile(file);
  }

  async function handleImport() {
    if (!selectedFile || isImporting) return;
    const fileType = fileTypeFor(selectedFile);
    if (!fileType) return;

    setIsImporting(true);
    try {
      const fileBase64 = await readAsBase64(selectedFile);
      const captchaToken = await getAnonymousCaptchaToken();
      const response = await requestCoverLetterImport({ captchaToken, fileBase64, fileType }, i18n.language);
      const result = await handleApiResponse<{ data: CoverLetterData }>(response, showToast, t);
      if (result) setImportedData(result.data);
    } finally {
      setIsImporting(false);
    }
  }

  const sections = importedData ? populatedSections(importedData) : [];
  const foundNothing = importedData !== null && sections.length === 0;

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-bold">{t("importCoverLetter.title")}</h3>

        {!importedData ? (
          <>
            <p className="text-base-content/60 mt-1 text-sm">{t("importCoverLetter.description")}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("importCoverLetter.chooseFileButton")}
              </button>
              <span className="text-sm opacity-70">
                {selectedFile ? selectedFile.name : t("importCoverLetter.noFileChosen")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={`${ACCEPTED_EXTENSIONS.pdf},${ACCEPTED_EXTENSIONS.docx}`}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="modal-action">
              <button type="button" className="btn" onClick={() => finish(null)}>
                {t("buttons.cancel")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedFile || isImporting}
                onClick={handleImport}
              >
                {isImporting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  t("importCoverLetter.importButton")
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base-content/60 mt-1 text-sm">{t("importCoverLetter.reviewDescription")}</p>

            <div className="mt-3">
              {foundNothing ? (
                <p className="text-warning text-sm">{t("importCoverLetter.nothingFound")}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sections.map((key) => (
                    <span key={key} className="badge badge-success badge-sm gap-1">
                      <CheckIcon className="h-3 w-3 stroke-current" />
                      {t(coverLetterSectionStepTitleKey[key])}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setImportedData(null);
                  setSelectedFile(null);
                }}
              >
                {t("importCoverLetter.chooseAnotherFile")}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => finish(importedData)}>
                {t("importCoverLetter.applyButton")}
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => finish(null)}>close</button>
      </form>
    </dialog>
  );
}
