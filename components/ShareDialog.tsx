"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import {
  disableCoverLetterSharing,
  enableCoverLetterSharing,
} from "@/lib/supabase/coverLetters";
import { disableResumeSharing, enableResumeSharing } from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";

export type ShareKind = "resume" | "coverLetter";

export interface ShareDialogHandle {
  open: (params: {
    kind: ShareKind;
    id: string;
    shareToken: string | null;
    shareTokenExpiresAt: string | null;
  }) => void;
}

export interface ShareDialogProps {
  ref?: Ref<ShareDialogHandle>;
  onTokenChange?: (token: string | null, expiresAt: string | null) => void;
}

function shareUrlFor(kind: ShareKind, token: string): string {
  const path = kind === "resume" ? "resume" : "cover-letter";
  return `${window.location.origin}/shared/${path}/${token}`;
}

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, { dateStyle: "medium" });
}

export default function ShareDialog({ ref, onTokenChange }: ShareDialogProps) {
  const { t, i18n } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<{
    kind: ShareKind;
    id: string;
    token: string | null;
    expiresAt: string | null;
  } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({
    open(params) {
      setState({
        kind: params.kind,
        id: params.id,
        token: params.shareToken,
        expiresAt: params.shareTokenExpiresAt,
      });
      setCopied(false);
      dialogRef.current?.showModal();
    },
  }));

  const shareUrl = state?.token ? shareUrlFor(state.kind, state.token) : null;

  async function handleEnable() {
    if (!state || isWorking) return;
    setIsWorking(true);
    try {
      const { token, expiresAt } =
        state.kind === "resume"
          ? await enableResumeSharing(supabase, state.id)
          : await enableCoverLetterSharing(supabase, state.id);
      setState((prev) => (prev ? { ...prev, token, expiresAt } : prev));
      onTokenChange?.(token, expiresAt);
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDisable() {
    if (!state || isWorking) return;
    setIsWorking(true);
    try {
      if (state.kind === "resume") {
        await disableResumeSharing(supabase, state.id);
      } else {
        await disableCoverLetterSharing(supabase, state.id);
      }
      setState((prev) => (prev ? { ...prev, token: null, expiresAt: null } : prev));
      onTokenChange?.(null, null);
    } finally {
      setIsWorking(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{t("share.title")}</h3>

        {shareUrl ? (
          <>
            <p className="text-base-content/70 mt-2 text-sm">{t("share.description")}</p>
            <div className="join mt-4 w-full">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="input input-bordered join-item w-full"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button type="button" className="btn btn-primary join-item" onClick={handleCopy}>
                {copied ? t("share.copied") : t("share.copyLink")}
              </button>
            </div>
            {state?.expiresAt && (
              <p className="text-base-content/60 mt-2 text-xs">
                {t("share.expiresOn", { date: formatDate(state.expiresAt, i18n.language) })}
              </p>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-4"
              disabled={isWorking}
              onClick={handleDisable}
            >
              {isWorking ? <span className="loading loading-spinner loading-xs" /> : t("share.stopSharing")}
            </button>
          </>
        ) : (
          <>
            <p className="text-base-content/70 mt-2 text-sm">{t("share.enableDescription")}</p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              disabled={isWorking}
              onClick={handleEnable}
            >
              {isWorking ? <span className="loading loading-spinner loading-xs" /> : t("share.createLink")}
            </button>
          </>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={close}>
            {t("buttons.cancel")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={close}>close</button>
      </form>
    </dialog>
  );
}
