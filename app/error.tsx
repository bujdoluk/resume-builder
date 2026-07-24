"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
      <h1 className="text-2xl font-bold">{t("errors.pageCrashTitle")}</h1>
      <p className="text-base-content/70 max-w-md">
        {t("errors.pageCrashDescription")}
      </p>
      <div className="mt-2 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          {t("errors.pageCrashRetry")}
        </button>
        <Link href="/" className="btn">
          {t("errors.pageCrashHome")}
        </Link>
      </div>
    </div>
  );
}
