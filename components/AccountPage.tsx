"use client";

/**
 * `/account` route content: shows the current user's plan and, for a paid
 * plan, a self-service cancel/resume control — this is the in-app
 * replacement for redirecting to Stripe's hosted Billing Portal (which
 * app/api/stripe/portal/route.ts used to do). Cancel/resume both POST to
 * app/api/stripe/cancel/route.ts, which toggles Stripe's
 * `cancel_at_period_end` and returns the fresh state directly — the
 * `subscriptions` table itself is still only ever written by the webhook
 * (app/api/stripe/webhook/route.ts), which catches up moments later.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import { ArrowLeftIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/client";
import { getSubscription, type Subscription } from "@/lib/supabase/subscriptions";

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, { dateStyle: "medium" });
}

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const cancelDialogRef = useRef<ConfirmDialogHandle>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || session.user.is_anonymous) {
        router.replace("/login?next=%2Faccount");
        return;
      }
      setEmail(session.user.email ?? "");
      setSubscription(await getSubscription(supabase, session.user.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleCancel() {
    const confirmed = await cancelDialogRef.current?.open({
      message: t("account.confirmCancel"),
      confirmLabel: t("account.cancelSubscription"),
    });
    if (!confirmed) return;
    await runAction("cancel");
  }

  async function handleResume() {
    await runAction("resume");
  }

  async function runAction(action: "cancel" | "resume") {
    setActionLoading(true);
    try {
      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Request failed");
      const body = await response.json();
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              status: body.status,
              cancelAtPeriodEnd: body.cancelAtPeriodEnd,
              currentPeriodEnd: body.currentPeriodEnd,
            }
          : prev,
      );
    } catch {
      alert(t("account.actionFailed"));
    } finally {
      setActionLoading(false);
    }
  }

  if (!email || !subscription) {
    return (
      <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const planName = t(`pricing.${subscription.plan}.name`);
  const periodEndDate = subscription.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd, i18n.language)
    : null;

  return (
    <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
      <div className="card bg-base-100 border-base-300 w-full max-w-xl border shadow-sm">
        <div className="card-body">
          <h1 className="text-center text-2xl font-bold">{t("account.title")}</h1>
          <p className="text-base-content/70 text-center text-sm">{email}</p>

          <div className="divide-base-300 bg-base-200 mt-6 divide-y rounded-lg px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-base-content/60 text-sm">{t("account.currentPlan")}</span>
              <span
                className={`badge badge-lg font-semibold ${
                  subscription.plan === "free" ? "badge-ghost" : "badge-primary"
                }`}
              >
                {planName}
              </span>
            </div>

            {subscription.plan !== "free" && periodEndDate && (
              <div className="flex items-center justify-between py-3">
                <span className="text-base-content/60 text-sm">
                  {subscription.cancelAtPeriodEnd ? t("account.endsOnLabel") : t("account.renewsOnLabel")}
                </span>
                <span
                  className={`text-sm font-medium ${subscription.cancelAtPeriodEnd ? "text-warning" : ""}`}
                >
                  {periodEndDate}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            {subscription.plan === "free" ? (
              <Link href="/#pricing" className="btn btn-primary btn-sm">
                {t("account.viewPlans")}
              </Link>
            ) : subscription.cancelAtPeriodEnd ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={actionLoading}
                onClick={handleResume}
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  t("account.resumeSubscription")
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                disabled={actionLoading}
                onClick={handleCancel}
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  t("account.cancelSubscription")
                )}
              </button>
            )}
          </div>

          <Link
            href="/"
            className="link link-hover text-base-content/60 mt-4 flex items-center justify-center gap-1 text-center text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4 stroke-current" />
            {t("account.goBack")}
          </Link>
        </div>
      </div>

      <ConfirmDialog ref={cancelDialogRef} />
    </div>
  );
}
