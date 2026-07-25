"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-2xl font-bold">{t("errors.pageNotFoundTitle")}</h1>
      <p className="text-base-content/70 max-w-md">{t("errors.notFound")}</p>
      <Link href="/" className="btn btn-primary mt-2">
        {t("errors.pageCrashHome")}
      </Link>
    </div>
  );
}
