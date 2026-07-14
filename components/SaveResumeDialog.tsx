"use client";

/**
 * Modal for naming or renaming a resume, exposed via a ref handle
 * (`open(initialName)` returns a Promise resolving to the entered name, or
 * null if cancelled). Used both when first saving a resume and when
 * renaming one from the "My Resumes" list — and, via the optional text
 * props below (defaulting to the resume copy so existing call sites are
 * unaffected), reused as-is by the cover letter builder's Save dialog too.
 */
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";

export interface SaveResumeDialogHandle {
  open: (initialName: string) => Promise<string | null>;
}

const MAX_NAME_LENGTH = 100;

export default function SaveResumeDialog({
  ref,
  title,
  placeholder,
  untitledFallback,
  tooLongMessage,
}: {
  ref?: Ref<SaveResumeDialogHandle>;
  title?: string;
  placeholder?: string;
  untitledFallback?: string;
  tooLongMessage?: string;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((name: string | null) => void) | null>(null);
  const [name, setName] = useState("");
  const isTooLong = name.trim().length > MAX_NAME_LENGTH;

  useImperativeHandle(ref, () => ({
    open(initialName) {
      setName(initialName);
      dialogRef.current?.showModal();
      return new Promise<string | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  function close(result: string | null) {
    dialogRef.current?.close();
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isTooLong) return;
    close(name.trim() || untitledFallback || t("myResumes.untitled"));
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {title ?? t("myResumes.nameDialogTitle")}
        </h3>
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset mt-4">
            <input
              type="text"
              className={`input input-bordered w-full ${isTooLong ? "input-error" : ""}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={placeholder ?? t("myResumes.namePlaceholder")}
              autoFocus
            />
            {isTooLong && (
              <p className="text-error mt-1 text-sm">
                {tooLongMessage ?? t("myResumes.nameTooLong")}
              </p>
            )}
          </fieldset>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => close(null)}>
              {t("buttons.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isTooLong}>
              {t("buttons.save")}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => close(null)}>close</button>
      </form>
    </dialog>
  );
}
