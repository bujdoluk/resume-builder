"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SparkleIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import { handleApiResponse } from "@/lib/apiResponse";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

export default function AiRewriteButton({
  text,
  style,
  onRewrite,
  className,
}: {
  text: string;
  style: "bullets" | "paragraph";
  onRewrite: (newText: string) => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [isRewriting, setIsRewriting] = useState(false);

  async function handleClick() {
    if (isRewriting || !text.trim()) return;
    setIsRewriting(true);
    try {
      const captchaToken = await getAnonymousCaptchaToken();
      const response = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: i18n.language },
        body: JSON.stringify({ captchaToken, text, style }),
      });
      const result = await handleApiResponse<{ rewritten: string }>(response, showToast, t);
      if (result) onRewrite(result.rewritten);
    } finally {
      setIsRewriting(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm ${className ?? ""}`}
      disabled={isRewriting || !text.trim()}
      onClick={handleClick}
    >
      {isRewriting ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <SparkleIcon className="h-4 w-4 stroke-current" />
      )}
      {t("buttons.aiAssistant")}
    </button>
  );
}
