"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Temporal } from "temporal-polyfill";
import { queryKeys } from "@/lib/queries/keys";
import {
  disableCoverLetterSharing,
  enableCoverLetterSharing,
} from "@/lib/supabase/coverLetters";
import { disableResumeSharing, enableResumeSharing } from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";
import type { CoverLetterRow } from "@/types/coverLetter";
import type { ResumeRow } from "@/types/resume";

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
  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    kind: ShareKind;
    id: string;
    token: string | null;
    expiresAt: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const enableMutation = useMutation({
    mutationFn: (params: { kind: ShareKind; id: string }) =>
      params.kind === "resume"
        ? enableResumeSharing(supabase, params.id)
        : enableCoverLetterSharing(supabase, params.id),
  });

  const disableMutation = useMutation({
    mutationFn: (params: { kind: ShareKind; id: string }) =>
      params.kind === "resume"
        ? disableResumeSharing(supabase, params.id)
        : disableCoverLetterSharing(supabase, params.id),
  });

  const isWorking = enableMutation.isPending || disableMutation.isPending;

  function syncDetailCache(token: string | null, expiresAt: string | null) {
    if (!state) return;
    if (state.kind === "resume") {
      queryClient.setQueryData<ResumeRow | null>(queryKeys.resumes.detail(state.id), (prev) =>
        prev ? { ...prev, shareToken: token, shareTokenExpiresAt: expiresAt } : prev,
      );
    } else {
      queryClient.setQueryData<CoverLetterRow | null>(queryKeys.coverLetters.detail(state.id), (prev) =>
        prev ? { ...prev, shareToken: token, shareTokenExpiresAt: expiresAt } : prev,
      );
    }
  }

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
    const { token, expiresAt } = await enableMutation.mutateAsync({ kind: state.kind, id: state.id });
    setState((prev) => (prev ? { ...prev, token, expiresAt } : prev));
    syncDetailCache(token, expiresAt);
    onTokenChange?.(token, expiresAt);
  }

  async function handleDisable() {
    if (!state || isWorking) return;
    await disableMutation.mutateAsync({ kind: state.kind, id: state.id });
    setState((prev) => (prev ? { ...prev, token: null, expiresAt: null } : prev));
    syncDetailCache(null, null);
    onTokenChange?.(null, null);
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
