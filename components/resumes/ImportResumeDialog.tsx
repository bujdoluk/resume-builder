"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import { handleApiResponse } from "@/lib/apiResponse";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/constants";
import { sectionKeySchema, type ResumeData, type SectionKey } from "@/lib/resumeData";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

export interface ImportResumeDialogHandle {
  open: () => Promise<ResumeData | null>;
}

type ImportFileType = "pdf" | "docx";

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

function populatedSections(data: ResumeData): SectionKey[] {
  const arraySections: Partial<Record<SectionKey, unknown[]>> = {
    workExperience: data.workExperience,
    education: data.education,
    skills: data.skills,
    certifications: data.certifications,
    languages: data.languages,
    interests: data.interests,
  };
  return Object.entries(arraySections)
    .filter(([, entries]) => (entries?.length ?? 0) > 0)
    .map(([key]) => sectionKeySchema.parse(key));
}

function hasPersonalInfo(data: ResumeData): boolean {
  return Boolean(data.name || data.jobTitle || data.email || data.phone || data.aboutMe);
}

export default function ImportResumeDialog({ ref }: { ref?: Ref<ImportResumeDialogHandle> }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolveRef = useRef<((data: ResumeData | null) => void) | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<ResumeData | null>(null);

  useImperativeHandle(ref, () => ({
    open() {
      setSelectedFile(null);
      setIsImporting(false);
      setImportedData(null);
      dialogRef.current?.showModal();
      return new Promise<ResumeData | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  function finish(data: ResumeData | null) {
    dialogRef.current?.close();
    resolveRef.current?.(data);
    resolveRef.current = null;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!fileTypeFor(file)) {
      showToast(t("importResume.unsupportedFileType"), "warning");
      return;
    }
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      showToast(t("importResume.fileTooLarge"), "warning");
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
      const response = await fetch("/api/import-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: i18n.language },
        body: JSON.stringify({ captchaToken, fileBase64, fileType }),
      });
      const result = await handleApiResponse<{ data: ResumeData }>(response, showToast, t);
      if (result) setImportedData(result.data);
    } finally {
      setIsImporting(false);
    }
  }

  const sections = importedData ? populatedSections(importedData) : [];
  const foundPersonalInfo = importedData ? hasPersonalInfo(importedData) : false;
  const foundNothing = importedData !== null && !foundPersonalInfo && sections.length === 0;

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-bold">{t("importResume.title")}</h3>

        {!importedData ? (
          <>
            <p className="text-base-content/60 mt-1 text-sm">{t("importResume.description")}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("importResume.chooseFileButton")}
              </button>
              <span className="text-sm opacity-70">
                {selectedFile ? selectedFile.name : t("importResume.noFileChosen")}
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
                {isImporting ? <span className="loading loading-spinner loading-xs" /> : t("importResume.importButton")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base-content/60 mt-1 text-sm">{t("importResume.reviewDescription")}</p>

            <div className="mt-3">
              {foundNothing ? (
                <p className="text-warning text-sm">{t("importResume.nothingFound")}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {foundPersonalInfo && (
                    <span className="badge badge-success badge-sm gap-1">
                      <CheckIcon className="h-3 w-3 stroke-current" />
                      {t("resumeSteps.personalInfo")}
                    </span>
                  )}
                  {sections.map((key) => (
                    <span key={key} className="badge badge-success badge-sm gap-1">
                      <CheckIcon className="h-3 w-3 stroke-current" />
                      {t(`sections.${key}`)}
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
                {t("importResume.chooseAnotherFile")}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => finish(importedData)}>
                {t("importResume.applyButton")}
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
