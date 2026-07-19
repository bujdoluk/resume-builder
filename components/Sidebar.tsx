"use client";

/**
 * Persistent editor navigation column (rendered once in the `(app)`
 * layout, so it survives navigation between `/app`, `/templates`, and
 * `/my-resumes`): a link to the My Resumes list, with a resume-count
 * badge, and its own collapse/expand toggle to reclaim width for the
 * editing canvas. The Templates link and the Features/Colours/Typography/
 * Font Size controls that used to live here have moved to the Navbar (see
 * `components/navbar/`), shown only on `/app`.
 *
 * At the `lg` breakpoint (where this sidebar shows full labels, not just
 * icons), it also renders whichever builder's completion-steps checklist is
 * currently active, below the nav links — fed by
 * `AppState.resumeStepsSummary`/`coverLetterStepsSummary`, which
 * `ResumeBuilder.tsx`/`CoverLetterBuilder.tsx` publish while mounted (and
 * clear on unmount). Both summaries share one fixed slot (only one is ever
 * non-null at a time, since only one builder is ever mounted) rather than
 * each getting its own spot next to its own nav link — that would shift the
 * links below it up/down every time the checklist appeared, disappeared, or
 * changed length while editing. Below `lg`, the builders render the same
 * checklist inline themselves instead (this sidebar collapses to icon-only
 * tabs there, with no room for it).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import CompletionSteps from "@/components/CompletionSteps";
import {
  EmailIcon,
  MyCoverLettersIcon,
  MyResumesIcon,
  PencilSquareIcon,
} from "@/components/Icons";
import {
  coverLetterSectionStepTitleKey,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { scrollToSectionAnchor } from "@/lib/scrollToSectionAnchor";
import { createClient } from "@/lib/supabase/client";
import { countCoverLetters } from "@/lib/supabase/coverLetters";
import { countResumes } from "@/lib/supabase/resumes";
import { ensureUserId } from "@/lib/supabase/session";
import { useAppState } from "@/components/AppState";

export default function Sidebar() {
  const { t } = useTranslation();
  const {
    resumeListVersion,
    coverLetterListVersion,
    lastEditorPath,
    resumeStepsSummary,
    coverLetterStepsSummary,
  } = useAppState();
  const [collapsed, setCollapsed] = useState(false);
  const [supabase] = useState(() => createClient());
  const [resumeCount, setResumeCount] = useState<number | null>(null);
  const [coverLetterCount, setCoverLetterCount] = useState<number | null>(null);

  // Refetch whenever resumeListVersion is bumped (ResumeBuilder.tsx after a save,
  // the "My Resumes" page after a delete) — this sidebar stays mounted
  // across navigations, so those pages can't just rely on a remount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await ensureUserId(supabase);
        const count = await countResumes(supabase, userId);
        if (!cancelled) setResumeCount(count);
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, resumeListVersion]);

  // Same refetch pattern as the resume count, keyed off
  // coverLetterListVersion (CoverLetterBuilder.tsx after a save, the "My
  // Cover Letters" page after a delete).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await ensureUserId(supabase);
        const count = await countCoverLetters(supabase, userId);
        if (!cancelled) setCoverLetterCount(count);
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, coverLetterListVersion]);

  return (
    <div className="bg-base-100 border-base-300 flex w-full flex-col border-b lg:h-full lg:w-auto lg:border-r lg:border-b-0">
      {/* Mobile/tablet: icon-only tab bar at the top */}
      <div role="tablist" className="tabs tabs-box m-2 lg:hidden">
        <Link
          href={lastEditorPath}
          role="tab"
          className="tab"
          aria-label={t("sidebar.resumeBuilder")}
          title={t("sidebar.resumeBuilder")}
        >
          <PencilSquareIcon className="h-5 w-5 stroke-current" />
        </Link>

        <Link
          href="/my-resumes"
          role="tab"
          className="tab"
          aria-label={t("sidebar.myResumes")}
          title={t("sidebar.myResumes")}
        >
          <span className="indicator">
            {!!resumeCount && (
              <span className="indicator-item badge badge-primary badge-xs">
                {resumeCount}
              </span>
            )}
            <MyResumesIcon className="h-5 w-5 stroke-current" />
          </span>
        </Link>

        <Link
          href="/cover-letter"
          role="tab"
          className="tab"
          aria-label={t("sidebar.coverLetterBuilder")}
          title={t("sidebar.coverLetterBuilder")}
        >
          <EmailIcon className="h-5 w-5 stroke-current" />
        </Link>

        <Link
          href="/my-cover-letters"
          role="tab"
          className="tab"
          aria-label={t("sidebar.myCoverLetters")}
          title={t("sidebar.myCoverLetters")}
        >
          <span className="indicator">
            {!!coverLetterCount && (
              <span className="indicator-item badge badge-primary badge-xs">
                {coverLetterCount}
              </span>
            )}
            <MyCoverLettersIcon className="h-5 w-5 stroke-current" />
          </span>
        </Link>
      </div>

      {/* Desktop: permanent left column with its own collapse toggle */}
      <div
        className={`hidden transition-[width] duration-200 lg:flex lg:flex-col ${
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`btn btn-primary btn-circle btn-sm fixed top-[calc(50%+2rem)] z-10 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-200 ${
            collapsed ? "left-20" : "left-64"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className={`h-5 w-5 stroke-current transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <ul className="menu w-full flex-nowrap p-4">
          <li>
            <Link
              href={lastEditorPath}
              title={collapsed ? t("sidebar.resumeBuilder") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <PencilSquareIcon className="h-7 w-7 stroke-current" />
              {!collapsed && (
                <span className="font-medium">{t("sidebar.resumeBuilder")}</span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/my-resumes"
              title={collapsed ? t("sidebar.myResumes") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <span className="indicator">
                {!!resumeCount && (
                  <span className="indicator-item badge badge-primary badge-xs">
                    {resumeCount}
                  </span>
                )}
                <MyResumesIcon className="h-7 w-7 stroke-current" />
              </span>
              {!collapsed && (
                <span className="font-medium">{t("sidebar.myResumes")}</span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/cover-letter"
              title={collapsed ? t("sidebar.coverLetterBuilder") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <EmailIcon className="h-7 w-7 stroke-current" />
              {!collapsed && (
                <span className="font-medium">
                  {t("sidebar.coverLetterBuilder")}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/my-cover-letters"
              title={collapsed ? t("sidebar.myCoverLetters") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <span className="indicator">
                {!!coverLetterCount && (
                  <span className="indicator-item badge badge-primary badge-xs">
                    {coverLetterCount}
                  </span>
                )}
                <MyCoverLettersIcon className="h-7 w-7 stroke-current" />
              </span>
              {!collapsed && (
                <span className="font-medium">{t("sidebar.myCoverLetters")}</span>
              )}
            </Link>
          </li>
        </ul>

        {/* One fixed slot for whichever builder is currently mounted, so
            the nav links above never shift position as steps appear,
            disappear, or change length while editing — only ever one of
            these two summaries is non-null at a time, since only one
            builder is ever mounted. */}
        {!collapsed && (resumeStepsSummary || coverLetterStepsSummary) && (
          <div className="border-t-base-300 mt-2 border-t px-4 pt-4">
            {resumeStepsSummary ? (
              <CompletionSteps
                stepKeys={resumeStepsSummary.stepKeys}
                incompleteKeys={resumeStepsSummary.incompleteKeys}
                completionPercent={resumeStepsSummary.completionPercent}
                titleKey={(key) =>
                  key === "personalInfo" ? "resumeSteps.personalInfo" : `sections.${key}`
                }
                tooltipKey={(key) => `resumeSteps.${key}Tooltip`}
                completedLabelKey="resumeSteps.completed"
                allCompleteLabelKey="resumeSteps.allComplete"
                onStepClick={scrollToSectionAnchor}
                tooltipAlign="start"
              />
            ) : (
              coverLetterStepsSummary && (
                <CompletionSteps
                  stepKeys={coverLetterStepsSummary.stepKeys}
                  incompleteKeys={coverLetterStepsSummary.incompleteKeys}
                  completionPercent={coverLetterStepsSummary.completionPercent}
                  titleKey={(key) =>
                    coverLetterSectionStepTitleKey[key as CoverLetterSectionKey]
                  }
                  tooltipKey={(key) => `coverLetterSteps.${key}Tooltip`}
                  completedLabelKey="coverLetterSteps.completed"
                  allCompleteLabelKey="coverLetterSteps.allComplete"
                  onStepClick={scrollToSectionAnchor}
                  tooltipAlign="start"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
