"use client";

/**
 * `/my-cover-letters` route: lists every cover letter the current
 * (anonymous) user has saved in Supabase, with actions to rename,
 * duplicate, edit, or delete each one — the cover letter counterpart of
 * `/my-resumes` (`app/(app)/my-resumes/page.tsx`), simplified since a
 * cover letter has no per-item template/color/font to display.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { useAppState } from "@/components/AppState";
import ConfirmDialog, {
  type ConfirmDialogHandle,
} from "@/components/ConfirmDialog";
import {
  DuplicateIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@/components/Icons";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import {
  COVER_LETTERS_PAGE_SIZE,
  countCoverLetters,
  deleteCoverLetter,
  duplicateCoverLetter,
  listCoverLetters,
  renameCoverLetter,
  type CoverLetterRow,
} from "@/lib/supabase/coverLetters";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, {
    dateStyle: "medium",
  });
}

export default function MyCoverLettersPage() {
  const { t, i18n } = useTranslation();
  const { notifyCoverLetterListChanged } = useAppState();
  const [supabase] = useState(() => createClient());
  const [coverLetters, setCoverLetters] = useState<CoverLetterRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / COVER_LETTERS_PAGE_SIZE));

  async function loadPage(pageNumber: number) {
    const userId = await ensureUserId(supabase);
    const [rows, count] = await Promise.all([
      listCoverLetters(supabase, userId, pageNumber),
      countCoverLetters(supabase, userId),
    ]);
    setCoverLetters(rows);
    setTotalCount(count);
    setPage(pageNumber);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await ensureUserId(supabase);
        const [rows, count] = await Promise.all([
          listCoverLetters(supabase, userId, 1),
          countCoverLetters(supabase, userId),
        ]);
        if (!cancelled) {
          setCoverLetters(rows);
          setTotalCount(count);
          setPage(1);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myCoverLetters.confirmDelete"),
      confirmLabel: t("myCoverLetters.delete"),
    });
    if (!confirmed) return;
    await deleteCoverLetter(supabase, id);
    notifyCoverLetterListChanged();
    const isLastRowOnPage = coverLetters?.length === 1 && page > 1;
    await loadPage(isLastRowOnPage ? page - 1 : page);
  }

  async function handleRename(row: CoverLetterRow) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    await renameCoverLetter(supabase, row.id, newName);
    await loadPage(page);
  }

  async function handleDuplicate(id: string) {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      await duplicateCoverLetter(supabase, id, await ensureUserId(supabase));
      notifyCoverLetterListChanged();
      await loadPage(1);
    } catch (error) {
      console.error(error);
      alert(t("myCoverLetters.duplicateFailed"));
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t("myCoverLetters.pageTitle")}</h1>
          <Link href="/cover-letter" className="btn btn-primary">
            {t("myCoverLetters.newCoverLetter")}
          </Link>
        </div>

        {loadFailed && (
          <p className="text-error">{t("myCoverLetters.loadFailed")}</p>
        )}

        {!loadFailed && coverLetters && coverLetters.length === 0 && (
          <p className="text-base-content/60">{t("myCoverLetters.empty")}</p>
        )}

        {!loadFailed && coverLetters && coverLetters.length > 0 && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("myCoverLetters.name")}</th>
                  <th>{t("myCoverLetters.created")}</th>
                  <th>{t("myCoverLetters.updated")}</th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coverLetters.map((row) => (
                  <tr key={row.id}>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.name || t("coverLetter.untitled")}
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {formatDate(row.createdAt, i18n.language)}
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {formatDate(row.updatedAt, i18n.language)}
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRename(row)}
                      >
                        <PencilIcon className="h-4 w-4 stroke-current" />
                        {t("myCoverLetters.rename")}
                      </button>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={duplicatingId === row.id}
                        onClick={() => handleDuplicate(row.id)}
                      >
                        {duplicatingId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <DuplicateIcon className="h-4 w-4 stroke-current" />
                        )}
                        {t("myCoverLetters.duplicate")}
                      </button>
                    </td>
                    <td className="w-px">
                      <Link
                        href={`/cover-letter?id=${row.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        <PencilSquareIcon className="h-4 w-4 stroke-current" />
                        {t("myCoverLetters.edit")}
                      </Link>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <TrashIcon className="h-4 w-4 stroke-current" />
                        {t("myCoverLetters.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadFailed && coverLetters && coverLetters.length > 0 && (
          <div className="join mt-auto flex justify-center pt-6">
            <button
              type="button"
              className="join-item btn"
              aria-label={t("aria.previousPage")}
              disabled={page === 1}
              onClick={() => loadPage(page - 1)}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`join-item btn ${pageNumber === page ? "btn-primary" : ""}`}
                  onClick={() => loadPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              className="join-item btn"
              aria-label={t("aria.nextPage")}
              disabled={page === totalPages}
              onClick={() => loadPage(page + 1)}
            >
              »
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog ref={confirmDialogRef} />
      <SaveResumeDialog
        ref={renameDialogRef}
        title={t("coverLetter.nameDialogTitle")}
        placeholder={t("coverLetter.namePlaceholder")}
        untitledFallback={t("coverLetter.untitled")}
        tooLongMessage={t("coverLetter.nameTooLong")}
      />
    </div>
  );
}
