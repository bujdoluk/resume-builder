"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "@/components/Icons";
import { SUPPORT_EMAIL } from "@/lib/supportEmail";
import { openSupportChat } from "@/lib/tawkChat";

export default function SupportPage() {
  const { t } = useTranslation();
  const router = useRouter();

  function handleChatClick() {
    if (!openSupportChat()) {
      window.location.href = `mailto:${SUPPORT_EMAIL}`;
    }
  }

  return (
    <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
      <div className="card bg-base-100 border-base-300 w-full max-w-xl border shadow-sm">
        <div className="card-body">
          <h1 className="text-center text-2xl font-bold">{t("account.support")}</h1>
          <p className="text-base-content/70 text-center text-sm">
            {t("account.supportDescription")}
          </p>

          <div className="divide-base-300 bg-base-200 mt-6 divide-y rounded-lg px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-base-content/60 text-sm">{t("auth.emailLabel")}</span>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="link text-sm font-medium">
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleChatClick}>
              {t("account.startChat")}
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
    </div>
  );
}
