"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { MAX_SAVED_ITEM_NAME_LENGTH } from "@/lib/constants";

export interface SaveResumeDialogHandle {
  open: (initialName: string) => Promise<string | null>;
}

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
  const isTooLong = name.trim().length > MAX_SAVED_ITEM_NAME_LENGTH;

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
