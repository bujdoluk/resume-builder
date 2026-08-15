"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import { ArrowLeftIcon, InfoIcon } from "@/components/Icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { useIsAdmin } from "@/components/useIsAdmin";
import { requestAccountDelete, requestAccountExport } from "@/lib/api/account";
import { handleApiResponse } from "@/lib/apiResponse";
import {
  AuthActionError,
  confirmTotpEnrollment,
  enrollTotp,
  getTotpFactor,
  unenrollTotp,
  verifyStepUpChallenge,
} from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import type { TotpEnrollment, TotpFactor } from "@/types/auth";

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, { dateStyle: "medium" });
}

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null);
  const isAdmin = useIsAdmin();
  const [mfaFactor, setMfaFactor] = useState<TotpFactor | null | undefined>(undefined);
  const [mfaEnrollment, setMfaEnrollment] = useState<TotpEnrollment | null>(null);
  const [mfaCode, setMfaCode] = useState<string>("");
  const [mfaBusy, setMfaBusy] = useState<boolean>(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaCopied, setMfaCopied] = useState<boolean>(false);
  const [mfaDisableConfirming, setMfaDisableConfirming] = useState<boolean>(false);
  const [mfaDisableCode, setMfaDisableCode] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user || session.user.is_anonymous) {
        router.replace("/login?next=%2Faccount");
        return;
      }
      setEmail(session.user.email ?? "");
      setCreatedAt(session.user.created_at);
    });
  }, [supabase, router]);

  useEffect(() => {
    if (!isAdmin) return;
    getTotpFactor(supabase).then(setMfaFactor);
  }, [isAdmin, supabase]);

  function mfaErrorMessage(error: unknown, fallbackKey: string): string {
    return error instanceof AuthActionError ? t(`auth.errors.${error.code}`) : t(fallbackKey);
  }

  async function handleEnableMfa() {
    setMfaBusy(true);
    setMfaError(null);
    try {
      const enrollment = await enrollTotp(supabase, "QuickResumeBuilder.online");
      setMfaEnrollment(enrollment);
      setMfaCode("");
      setMfaCopied(false);
    } catch (error) {
      showToast(mfaErrorMessage(error, "account.mfa.enrollFailed"), "error");
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleCancelMfaSetup() {
    if (mfaEnrollment) {
      await unenrollTotp(supabase, mfaEnrollment.factorId).catch(() => {});
    }
    setMfaEnrollment(null);
    setMfaCode("");
    setMfaError(null);
  }

  async function handleConfirmMfaSetup(event: React.FormEvent) {
    event.preventDefault();
    if (!mfaEnrollment || mfaBusy) return;
    setMfaBusy(true);
    setMfaError(null);
    try {
      await confirmTotpEnrollment(supabase, mfaEnrollment.factorId, mfaCode);
      const factor = await getTotpFactor(supabase);
      setMfaFactor(factor);
      setMfaEnrollment(null);
      setMfaCode("");
    } catch (error) {
      setMfaError(mfaErrorMessage(error, "account.mfa.enrollFailed"));
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleCopyMfaSecret() {
    if (!mfaEnrollment) return;
    await navigator.clipboard.writeText(mfaEnrollment.secret);
    setMfaCopied(true);
  }

  function handleDisableMfa() {
    if (!mfaFactor) return;
    setMfaError(null);
    setMfaDisableCode("");
    setMfaDisableConfirming(true);
  }

  function handleCancelDisableMfa() {
    setMfaDisableConfirming(false);
    setMfaDisableCode("");
    setMfaError(null);
  }

  async function handleConfirmDisableMfa(event: React.FormEvent) {
    event.preventDefault();
    if (!mfaFactor || mfaBusy) return;
    setMfaBusy(true);
    setMfaError(null);
    try {
      await verifyStepUpChallenge(supabase, mfaDisableCode);
      await unenrollTotp(supabase, mfaFactor.id);
      setMfaFactor(null);
      setMfaDisableConfirming(false);
      setMfaDisableCode("");
    } catch (error) {
      setMfaError(mfaErrorMessage(error, "account.mfa.disableFailed"));
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const response = await requestAccountExport(i18n.language);
      const data = await handleApiResponse(response, showToast, t);
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quickresumebuilder-data-${Temporal.Now.plainDateISO().toString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = await deleteDialogRef.current?.open({
      message: t("account.confirmDelete"),
      confirmLabel: t("account.deleteAccount"),
    });
    if (!confirmed) return;

    setActionLoading(true);
    const response = await requestAccountDelete(i18n.language);
    const result = await handleApiResponse(response, showToast, t);
    if (!result) {
      setActionLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!email) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
      <div className="card bg-base-100 border-base-300 w-full max-w-xl border shadow-sm">
        <div className="card-body">
          <h1 className="text-center text-2xl font-bold">{t("account.title")}</h1>

          <div className="divide-base-300 bg-base-200 mt-6 divide-y rounded-lg px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-base-content/60 text-sm">{t("auth.emailLabel")}</span>
              <span className="text-sm font-medium">{email}</span>
            </div>

            {createdAt && (
              <div className="flex items-center justify-between py-3">
                <span className="text-base-content/60 text-sm">{t("account.memberSince")}</span>
                <span className="text-sm font-medium">{formatDate(createdAt, i18n.language)}</span>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <div className="divider" />
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold">{t("account.mfa.sectionTitle")}</h2>
                <div className="tooltip tooltip-primary tooltip-bottom tooltip-start">
                  <div className="tooltip-content">
                    <div className="flex max-w-64 flex-col gap-1.5 p-1 text-left text-xs">
                      <p>{t("account.mfa.help.intro")}</p>
                      <p>{t("account.mfa.help.step1")}</p>
                      <p>{t("account.mfa.help.step2")}</p>
                      <p>{t("account.mfa.help.step3")}</p>
                    </div>
                  </div>
                  <InfoIcon className="h-4 w-4 shrink-0 stroke-current opacity-60" />
                </div>
              </div>

              {mfaFactor === undefined ? (
                <span className="loading loading-spinner loading-sm mt-2" />
              ) : mfaEnrollment ? (
                <form onSubmit={handleConfirmMfaSetup} className="mt-2 flex flex-col gap-3">
                  <p className="text-base-content/70 text-sm">{t("account.mfa.scanInstructions")}</p>
                  <Image
                    src={mfaEnrollment.qrCode}
                    alt={t("account.mfa.sectionTitle")}
                    width={160}
                    height={160}
                    className="mx-auto h-40 w-40 rounded-lg bg-white p-2"
                    unoptimized
                  />
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t("account.mfa.secretLabel")}</legend>
                    <div className="join w-full">
                      <input
                        type="text"
                        readOnly
                        value={mfaEnrollment.secret}
                        className="input input-bordered join-item w-full font-mono text-sm"
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <button
                        type="button"
                        className="btn join-item"
                        onClick={handleCopyMfaSecret}
                      >
                        {mfaCopied ? t("account.mfa.copied") : t("account.mfa.copySecret")}
                      </button>
                    </div>
                  </fieldset>
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t("account.mfa.codeLabel")}</legend>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="input input-bordered w-full"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      required
                    />
                  </fieldset>
                  {mfaError && <p className="text-error text-sm">{mfaError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1" disabled={mfaBusy}>
                      {mfaBusy ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        t("account.mfa.confirm")
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={mfaBusy}
                      onClick={handleCancelMfaSetup}
                    >
                      {t("account.mfa.cancelSetup")}
                    </button>
                  </div>
                </form>
              ) : mfaDisableConfirming ? (
                <form onSubmit={handleConfirmDisableMfa} className="mt-2 flex flex-col gap-3">
                  <p className="text-base-content/70 text-sm">{t("account.mfa.confirmDisable")}</p>
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t("account.mfa.codeLabel")}</legend>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="input input-bordered w-full"
                      value={mfaDisableCode}
                      onChange={(event) => setMfaDisableCode(event.target.value)}
                      autoFocus
                      required
                    />
                  </fieldset>
                  {mfaError && <p className="text-error text-sm">{mfaError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-error flex-1" disabled={mfaBusy}>
                      {mfaBusy ? <span className="loading loading-spinner loading-xs" /> : t("account.mfa.disable")}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={mfaBusy}
                      onClick={handleCancelDisableMfa}
                    >
                      {t("account.mfa.cancelSetup")}
                    </button>
                  </div>
                </form>
              ) : mfaFactor ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base-content/60 text-sm">
                    {t("account.mfa.enabledStatus", { date: formatDate(mfaFactor.createdAt, i18n.language) })}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm"
                    disabled={mfaBusy}
                    onClick={handleDisableMfa}
                  >
                    {t("account.mfa.disable")}
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base-content/70 text-sm">{t("account.mfa.description")}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={mfaBusy}
                    onClick={handleEnableMfa}
                  >
                    {mfaBusy ? <span className="loading loading-spinner loading-xs" /> : t("account.mfa.enable")}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="divider" />

          <h2 className="text-error text-sm font-semibold">{t("account.dangerZone")}</h2>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={exportLoading || actionLoading}
              onClick={handleExport}
            >
              {exportLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                t("account.exportData")
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-error btn-sm"
              disabled={actionLoading || exportLoading}
              onClick={handleDelete}
            >
              {actionLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                t("account.deleteAccount")
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="link link-hover text-base-content/60 mt-4 flex items-center justify-center gap-1 text-center text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4 stroke-current" />
            {t("account.goBack")}
          </button>
        </div>
      </div>

      <ConfirmDialog ref={deleteDialogRef} />
    </div>
  );
}
