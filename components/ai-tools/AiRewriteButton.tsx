"use client";

import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { SparkleIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { requestAiRewrite } from "@/lib/api/aiRewrite";
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

  const rewriteMutation = useMutation({
    mutationFn: async () => {
      const captchaToken = await getAnonymousCaptchaToken();
      return requestAiRewrite({ captchaToken, text, style }, i18n.language);
    },
  });

  async function handleClick() {
    if (rewriteMutation.isPending || !text.trim()) return;
    const response = await rewriteMutation.mutateAsync();
    const result = await handleApiResponse<{ rewritten: string }>(response, showToast, t);
    if (result) onRewrite(result.rewritten);
  }

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm ${className ?? ""}`}
      disabled={rewriteMutation.isPending || !text.trim()}
      onClick={handleClick}
    >
      {rewriteMutation.isPending ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <SparkleIcon className="h-4 w-4 stroke-current" />
      )}
      {t("buttons.aiAssistant")}
    </button>
  );
}
