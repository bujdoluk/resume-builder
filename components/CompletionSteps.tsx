"use client";

import { useTranslation } from "react-i18next";
import { InfoIcon } from "@/components/Icons";

export interface CompletionStepsProps {
  stepKeys: string[];
  incompleteKeys: string[];
  completionPercent: number;
  titleKey: (key: string) => string;
  titleOverride?: (key: string) => string | undefined;
  tooltipKey: (key: string) => string;
  completedLabelKey: string;
  allCompleteLabelKey: string;
  onStepClick: (key: string) => void;

  tooltipAlign?: "start" | "end";
}

export default function CompletionSteps({
  stepKeys,
  incompleteKeys,
  completionPercent,
  titleKey,
  titleOverride,
  tooltipKey,
  completedLabelKey,
  allCompleteLabelKey,
  onStepClick,
  tooltipAlign = "end",
}: CompletionStepsProps) {
  const { t } = useTranslation();

  if (stepKeys.length === 0) return null;

  function resolveTitle(key: string): string {
    return titleOverride?.(key) || t(titleKey(key));
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="steps steps-vertical overflow-visible!">
        {stepKeys.map((key) => (
          <li
            key={key}
            className={`step ${incompleteKeys.includes(key) ? "" : "step-primary"}`}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="cursor-pointer text-left font-medium"
                onClick={() => onStepClick(key)}
              >
                {resolveTitle(key)}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-auto flex items-center gap-2">
        <div
          className="radial-progress text-primary"
          style={
            {
              "--value": completionPercent,
              "--size": "4rem",
            } as React.CSSProperties
          }
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {completionPercent}%
        </div>
        <span className="text-base font-medium">{t(completedLabelKey)}</span>

        <div
          className={`tooltip tooltip-primary tooltip-bottom -ml-1 mt-1.5 self-start ${
            tooltipAlign === "start" ? "tooltip-start" : "tooltip-end"
          }`}
        >
          <div className="tooltip-content">
            <div className="flex flex-col gap-1.5 p-1 text-left text-xs">
              {incompleteKeys.length === 0 ? (
                <span>{t(allCompleteLabelKey)}</span>
              ) : (
                incompleteKeys.map((incompleteKey) => (
                  <p key={incompleteKey}>
                    <span className="font-semibold">{resolveTitle(incompleteKey)}:</span>{" "}
                    {t(tooltipKey(incompleteKey))}
                  </p>
                ))
              )}
            </div>
          </div>
          <InfoIcon className="h-4 w-4 shrink-0 stroke-current opacity-60" />
        </div>
      </div>
    </div>
  );
}
