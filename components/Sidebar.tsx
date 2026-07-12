"use client";

/**
 * Persistent editor navigation column (rendered once in the `(app)`
 * layout, so it survives navigation between `/app`, `/templates`, and
 * `/my-resumes`): a link to the My Resumes list, with a resume-count
 * badge, and its own collapse/expand toggle to reclaim width for the
 * editing canvas. The Templates link and the Features/Colours/Typography/
 * Font Size controls that used to live here have moved to the Navbar (see
 * `components/navbar/`), shown only on `/app`.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MyResumesIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/client";
import { countResumes } from "@/lib/supabase/resumes";
import { ensureUserId } from "@/lib/supabase/session";
import { useAppState } from "@/components/AppState";

export default function Sidebar() {
  const { t } = useTranslation();
  const { resumeListVersion } = useAppState();
  const [collapsed, setCollapsed] = useState(false);
  const [supabase] = useState(() => createClient());
  const [resumeCount, setResumeCount] = useState<number | null>(null);

  // Refetch whenever resumeListVersion is bumped (Home.tsx after a save,
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, resumeListVersion]);

  return (
    <div className="bg-base-100 border-base-300 flex w-full flex-col border-b lg:h-full lg:w-auto lg:border-r lg:border-b-0">
      {/* Mobile/tablet: icon-only tab bar at the top */}
      <div role="tablist" className="tabs tabs-box m-2 lg:hidden">
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
              href="/my-resumes"
              title={collapsed ? t("sidebar.myResumes") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <MyResumesIcon className="h-7 w-7 stroke-current" />
              {!collapsed && (
                <span className="indicator">
                  {!!resumeCount && (
                    <span className="indicator-item badge badge-primary badge-xs translate-x-6">
                      {resumeCount}
                    </span>
                  )}
                  {t("sidebar.myResumes")}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
