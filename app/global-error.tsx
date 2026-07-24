"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import "@/lib/i18n/i18n";
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-2xl font-bold">{t("errors.pageCrashTitle")}</h1>
        <p className="max-w-md text-base-content/70">
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
      </body>
    </html>
  );
}
