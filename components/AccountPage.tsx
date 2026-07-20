"use client";

/**
 * `/account` route content: account info (email, member since) plus
 * self-service data export and account deletion. Subscription/billing
 * moved to `components/BillingPage.tsx` (`/billing`) — the navbar's email
 * dropdown (`components/navbar/AuthButton.tsx`) links to both separately.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import { ArrowLeftIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/client";

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, { dateStyle: "medium" });
}

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user || session.user.is_anonymous) {
        router.replace("/login?next=%2Faccount");
        return;
      }
      setEmail(session.user.email ?? "");
      setCreatedAt(session.user.created_at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleExport() {
    setExportLoading(true);
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quickresumebuilder-data-${Temporal.Now.plainDateISO().toString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t("account.actionFailed"));
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
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) throw new Error("Request failed");
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      alert(t("account.deleteFailed"));
      setActionLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
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
              {t("account.deleteAccount")}
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
