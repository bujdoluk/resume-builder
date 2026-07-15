"use client";

/**
 * Body of the `/blog` placeholder page — just a title and a "coming soon"
 * notice for now, split out from `app/blog/page.tsx` since that stays a
 * server component (for the page-level `metadata` export) while this needs
 * `useTranslation`.
 */
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function BlogPageContent() {
  const { t } = useTranslation();

  return (
    <div className="bg-base-200 flex-1 p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("blog.pageTitle")}</h1>
        <Link href="/app" className="btn btn-primary">
          {t("landing.ctaStart")}
        </Link>
      </div>

      <p className="text-base-content/70">{t("blog.comingSoon")}</p>
    </div>
  );
}
