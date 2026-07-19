"use client";

/**
 * The completion-steps checklist (vertical step list + radial progress +
 * an info tooltip listing what's left) — presentational and format-agnostic
 * (works off plain string keys), so it can render identically in two
 * places for the cover letter editor: inline in `CoverLetterBuilder.tsx`
 * itself (hidden at the `lg` breakpoint), and in `Sidebar.tsx` under the
 * "My Cover Letters" link (shown only at `lg`+, once
 * `AppState.coverLetterStepsSummary` is populated) — see that file for why
 * the split happens at `lg`, matching the Sidebar's own collapse behavior.
 */
import { useTranslation } from "react-i18next";
import { InfoIcon } from "@/components/Icons";

export interface CompletionStepsProps {
  stepKeys: string[];
  incompleteKeys: string[];
  completionPercent: number;
  titleKey: (key: string) => string;
  tooltipKey: (key: string) => string;
  completedLabelKey: string;
  allCompleteLabelKey: string;
  onStepClick: (key: string) => void;
  // Which side the info tooltip's popup grows toward — daisyUI's
  // `tooltip-end` (default) aligns the popup's end edge to the icon,
  // growing toward the start (left, in LTR); `tooltip-start` grows the
  // other way. Both builders' own inline checklists have open space to the
  // left, so the default suits them, but `Sidebar.tsx` pins this component
  // to the left edge of the screen — with nothing but empty screen to the
  // left of it, so it needs "start" to grow rightward into the canvas
  // instead of clipping off the browser's left edge.
  tooltipAlign?: "start" | "end";
}

export default function CompletionSteps({
  stepKeys,
  incompleteKeys,
  completionPercent,
  titleKey,
  tooltipKey,
  completedLabelKey,
  allCompleteLabelKey,
  onStepClick,
  tooltipAlign = "end",
}: CompletionStepsProps) {
  const { t } = useTranslation();

  if (stepKeys.length === 0) return null;

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
                {t(titleKey(key))}
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
                    <span className="font-semibold">{t(titleKey(incompleteKey))}:</span>{" "}
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
