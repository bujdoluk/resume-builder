"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { CheckIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import { handleApiResponse } from "@/lib/apiResponse";
import { matchKeywords } from "@/lib/atsChecker/matchKeywords";
import type { FormatCheckItem, KeywordMatchResult } from "@/lib/atsChecker/types";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

export interface AtsCheckerDialogHandle {
  open: (params: { formatChecks: FormatCheckItem[]; documentText: string }) => void;
}

interface CoherenceResult {
  coherent: boolean;
  reason: string;
}

export default function AtsCheckerDialog({ ref }: { ref?: Ref<AtsCheckerDialogHandle> }) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formatChecks, setFormatChecks] = useState<FormatCheckItem[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState<KeywordMatchResult | null>(null);
  const [isCheckingCoherence, setIsCheckingCoherence] = useState(false);
  const [coherenceResult, setCoherenceResult] = useState<CoherenceResult | null>(null);

  useImperativeHandle(ref, () => ({
    open({ formatChecks: nextChecks, documentText: nextText }) {
      setFormatChecks(nextChecks);
      setDocumentText(nextText);
      setJobDescription("");
      setMatchResult(null);
      setCoherenceResult(null);
      dialogRef.current?.showModal();
    },
  }));

  function close() {
    dialogRef.current?.close();
  }

  function handleAnalyze() {
    if (!jobDescription.trim()) return;
    setMatchResult(matchKeywords(documentText, jobDescription));
  }

  async function handleCheckCoherence() {
    if (isCheckingCoherence) return;
    setIsCheckingCoherence(true);
    try {
      const captchaToken = await getAnonymousCaptchaToken();
      const response = await fetch("/api/ats-coherence", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: i18n.language },
        body: JSON.stringify({ captchaToken, documentText }),
      });
      const result = await handleApiResponse<CoherenceResult>(response, showToast, t);
      if (result) setCoherenceResult(result);
    } finally {
      setIsCheckingCoherence(false);
    }
  }

  const passedCount = formatChecks.filter((item) => item.passed).length;
  const formatScore = formatChecks.length === 0 ? 0 : Math.round((passedCount / formatChecks.length) * 100);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-xl">
        <h3 className="text-lg font-bold">{t("atsChecker.title")}</h3>

        <div className="mt-4">
          <h4 className="font-semibold">{t("atsChecker.formatCheckTitle")}</h4>
          <p className="text-base-content/60 mt-1 text-xs">{t("atsChecker.formatCheckDisclaimer")}</p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="radial-progress text-primary"
              style={{ "--value": formatScore, "--size": "3.5rem" } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={formatScore}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {formatScore}%
            </div>
            <span className="text-sm opacity-70">
              {t("atsChecker.checksPassed", { passed: passedCount, total: formatChecks.length })}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {formatChecks.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                {item.passed ? (
                  <CheckIcon className="text-success h-4 w-4 shrink-0 stroke-current" />
                ) : (
                  <span className="bg-warning/20 text-warning flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs">
                    !
                  </span>
                )}
                <span className={item.passed ? "" : "text-warning"}>{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="divider" />

        <div>
          <h4 className="font-semibold">{t("atsChecker.jobDescriptionTitle")}</h4>
          <p className="text-base-content/60 mt-1 text-xs">{t("atsChecker.disclaimer")}</p>
          <AutoResizeTextarea
            className="textarea textarea-bordered mt-2 w-full"
            value={jobDescription}
            placeholder={t("atsChecker.pastePlaceholder")}
            onChange={(event) => setJobDescription(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm mt-2"
            disabled={!jobDescription.trim()}
            onClick={handleAnalyze}
          >
            {t("atsChecker.analyzeButton")}
          </button>

          {matchResult && (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <div
                  className="radial-progress text-primary"
                  style={{ "--value": matchResult.score, "--size": "3.5rem" } as React.CSSProperties}
                  role="progressbar"
                  aria-valuenow={matchResult.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {matchResult.score}%
                </div>
                <span className="text-sm opacity-70">{t("atsChecker.matchScoreLabel")}</span>
              </div>

              {matchResult.matched.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold">{t("atsChecker.matchedLabel")}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {matchResult.matched.map((keyword) => (
                      <span key={keyword} className="badge badge-success badge-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.missing.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold">{t("atsChecker.missingLabel")}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {matchResult.missing.map((keyword) => (
                      <span key={keyword} className="badge badge-warning badge-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="divider" />

        <div>
          <h4 className="font-semibold">{t("atsChecker.coherenceTitle")}</h4>
          <p className="text-base-content/60 mt-1 text-xs">{t("atsChecker.coherenceDescription")}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-2"
            disabled={isCheckingCoherence}
            onClick={handleCheckCoherence}
          >
            {isCheckingCoherence ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              t("atsChecker.checkCoherenceButton")
            )}
          </button>

          {coherenceResult && (
            <p
              className={`mt-2 flex items-start gap-2 text-sm ${
                coherenceResult.coherent ? "" : "text-warning"
              }`}
            >
              {coherenceResult.coherent ? (
                <CheckIcon className="text-success mt-0.5 h-4 w-4 shrink-0 stroke-current" />
              ) : (
                <span className="bg-warning/20 text-warning mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs">
                  !
                </span>
              )}
              <span>
                {coherenceResult.coherent ? t("atsChecker.coherentResult") : coherenceResult.reason}
              </span>
            </p>
          )}
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={close}>
            {t("buttons.cancel")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={close}>close</button>
      </form>
    </dialog>
  );
}
