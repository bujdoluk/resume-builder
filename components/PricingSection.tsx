"use client";

/**
 * Landing page pricing section (`id="pricing"`, linked from the upgrade
 * dialogs in ResumeBuilder.tsx/CoverLetterBuilder.tsx via `/#pricing`):
 * three tiers — Free (no checkout, just links straight into the app) and
 * Pro/Annual, which POST to /api/stripe/checkout and redirect to Stripe's
 * hosted Checkout page. Logged-out/anonymous visitors are routed to
 * /login first, since Checkout needs a real account to attach the
 * subscription to.
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

  const freeFeatures = t("pricing.free.features", { returnObjects: true }) as string[];
  const proFeatures = t("pricing.pro.features", { returnObjects: true }) as string[];
  const annualFeatures = t("pricing.annual.features", { returnObjects: true }) as string[];

  return (
    <div id="pricing" className="mx-auto max-w-5xl px-8 py-20">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("pricing.title")}</h2>
      <p className="text-base-content/70 mx-auto mt-3 max-w-xl text-center">
        {t("pricing.subtitle")}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card bg-base-100 border-base-300 border">
          <div className="card-body">
            <h3 className="text-lg font-bold">{t("pricing.free.name")}</h3>
            <p className="text-3xl font-bold">{t("pricing.free.price")}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="text-success mt-0.5 h-4 w-4 shrink-0 stroke-current" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn btn-outline mt-6">
              {t("pricing.free.cta")}
            </Link>
          </div>
        </div>

        <div className="card bg-base-100 border-primary border-2">
          <div className="card-body">
            <h3 className="text-lg font-bold">{t("pricing.pro.name")}</h3>
            <p className="text-3xl font-bold">
              {t("pricing.pro.price")}
              <span className="text-base-content/60 text-base font-normal">
                {t("pricing.pro.period")}
              </span>
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="text-success mt-0.5 h-4 w-4 shrink-0 stroke-current" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary mt-6"
              disabled={loadingPlan !== null}
              onClick={() => handleUpgrade("monthly")}
            >
              {loadingPlan === "monthly" ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t("pricing.pro.cta")
              )}
            </button>
          </div>
        </div>

        <div className="card bg-base-100 border-base-300 border">
          <div className="card-body">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{t("pricing.annual.name")}</h3>
              <span className="badge badge-success badge-sm">{t("pricing.annual.badge")}</span>
            </div>
            <p className="text-3xl font-bold">
              {t("pricing.annual.price")}
              <span className="text-base-content/60 text-base font-normal">
                {t("pricing.annual.period")}
              </span>
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {annualFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="text-success mt-0.5 h-4 w-4 shrink-0 stroke-current" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-outline mt-6"
              disabled={loadingPlan !== null}
              onClick={() => handleUpgrade("annual")}
            >
              {loadingPlan === "annual" ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t("pricing.annual.cta")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
