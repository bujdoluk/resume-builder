"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useTranslation } from "react-i18next";

export interface ConfirmOptions {
  message: ReactNode;
  confirmLabel?: ReactNode;
}

export interface ConfirmDialogHandle {

  open: (options: ConfirmOptions) => Promise<boolean>;
}

export default function ConfirmDialog({
  ref,
}: {
  ref?: Ref<ConfirmDialogHandle>;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [message, setMessage] = useState<ReactNode>(null);
  const [confirmLabel, setConfirmLabel] = useState<ReactNode>(null);

  useImperativeHandle(ref, () => ({
    open({ message: nextMessage, confirmLabel: nextConfirmLabel }) {
      setMessage(nextMessage);
      setConfirmLabel(nextConfirmLabel ?? t("buttons.confirm"));
      dialogRef.current?.showModal();
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  function close(confirmed: boolean) {
    dialogRef.current?.close();
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <p>{message}</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => close(false)}>
            {t("buttons.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => close(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => close(false)}>close</button>
      </form>
    </dialog>
  );
}
