"use client";

/**
 * Landing page pricing section (`id="pricing"`, linked from the upgrade
 * dialogs in ResumeBuilder.tsx/CoverLetterBuilder.tsx via `/#pricing`):
 * a feature-comparison table — one row per feature, one column per plan —
 * rather than three independent bullet lists, so every plan's full feature
 * set is visible and matching features line up across plans instead of
 * only listing each plan's differences from the one before it. Free (no
 * checkout, just links straight into the app) and Pro/Annual, which POST
 * to /api/stripe/checkout and redirect to Stripe's hosted Checkout page.
 * Logged-out/anonymous visitors are routed to /login first, since
 * Checkout needs a real account to attach the subscription to.
 *
 * The outer `#pricing` div deliberately carries no `mx-auto`/`max-w-*` of
 * its own (padding/centering live on inner divs instead) — this is a
 * direct child of LandingPage.tsx's `flex flex-col` root, and a flex item
 * with `mx-auto` opts out of the default stretch-to-container-width
 * behavior, sizing to its content instead (here, the comparison table's
 * intrinsic width) regardless of the viewport. That silently broke mobile
 * layout: the whole section — table included — rendered at the table's
 * full content width and got clipped by the root's `overflow-x-hidden`
 * instead of scrolling. Matches the same outer-padding/inner-centering
 * split already used by the hero and testimonials sections below.
 */
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/client";

type PaidPlan = "monthly" | "annual";

export default function PricingSection() {
  const { t } = useTranslation();
  const [supabase] = useState(() => createClient());
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  async function handleUpgrade(plan: PaidPlan) {
    if (loadingPlan) return;
    setLoadingPlan(plan);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || session.user.is_anonymous) {
        window.location.href = "/login?next=%2F%23pricing";
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = await response.json();
      if (body.url) {
        window.location.href = body.url;
      } else {
        setLoadingPlan(null);
      }
    } catch {
      setLoadingPlan(null);
    }
  }

  const featureRows = t("pricing.featureRows", { returnObjects: true }) as string[];

  return (
    <div id="pricing" className="py-20">
      <h2 className="mx-auto max-w-3xl px-8 text-center text-2xl font-bold sm:text-3xl">
        {t("pricing.title")}
      </h2>
      <p className="text-base-content/70 mx-auto mt-3 max-w-xl px-8 text-center">
        {t("pricing.subtitle")}
      </p>

      <div className="mx-auto mt-10 max-w-6xl px-8">
        <div className="bg-base-200 border-base-300 overflow-x-auto rounded-lg border">
          <table className="table table-fixed min-w-[640px]">
            <thead>
              <tr>
                <th className="w-[39%]"></th>
                <th className="w-[20%] text-center">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-base font-bold">{t("pricing.free.name")}</span>
                    <span className="text-2xl font-bold">{t("pricing.free.price")}</span>
                    <Link href="/app" className="btn btn-outline btn-sm mt-1">
                      {t("pricing.free.cta")}
                    </Link>
                  </div>
                </th>
                <th className="bg-primary/5 border-primary w-[21%] rounded-t-lg border-t-2 border-x-2 border-b-0 text-center">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-base font-bold">{t("pricing.pro.name")}</span>
                    <span className="text-2xl font-bold">
                      {t("pricing.pro.price")}
                      <span className="text-base-content/60 text-sm font-normal">
                        {t("pricing.pro.period")}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mt-1"
                      disabled={loadingPlan !== null}
                      onClick={() => handleUpgrade("monthly")}
                    >
                      {loadingPlan === "monthly" ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        t("pricing.pro.cta")
                      )}
                    </button>
                  </div>
                </th>
                <th className="w-[20%] text-center">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">{t("pricing.annual.name")}</span>
                      <span className="badge badge-success badge-sm">
                        {t("pricing.annual.badge")}
                      </span>
                    </div>
                    <span className="text-2xl font-bold">
                      {t("pricing.annual.price")}
                      <span className="text-base-content/60 text-sm font-normal">
                        {t("pricing.annual.period")}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm mt-1"
                      disabled={loadingPlan !== null}
                      onClick={() => handleUpgrade("annual")}
                    >
                      {loadingPlan === "annual" ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        t("pricing.annual.cta")
                      )}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map((feature) => (
                <tr key={feature}>
                  <td className="text-sm">{feature}</td>
                  <td className="text-center">
                    <CheckIcon className="text-success mx-auto h-4 w-4 stroke-current" />
                  </td>
                  <td className="bg-primary/5 border-primary border-x-2 border-b-0 text-center">
                    <CheckIcon className="text-success mx-auto h-4 w-4 stroke-current" />
                  </td>
                  <td className="text-center">
                    <CheckIcon className="text-success mx-auto h-4 w-4 stroke-current" />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="text-sm">{t("pricing.savedItemsLabel")}</td>
                <td className="text-center text-sm">{t("pricing.free.savedItemsValue")}</td>
                <td className="bg-primary/5 border-primary rounded-b-lg border-x-2 border-b-2 text-center text-sm font-semibold">
                  {t("pricing.pro.savedItemsValue")}
                </td>
                <td className="text-center text-sm">{t("pricing.annual.savedItemsValue")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
