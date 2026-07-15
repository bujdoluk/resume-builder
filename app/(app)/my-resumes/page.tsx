"use client";

/**
 * `/my-resumes` route: lists every resume the current (anonymous) user has
 * saved in Supabase, with actions to rename, duplicate, edit, or delete each
 * one.
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
import SortableColumnHeader from "@/components/SortableColumnHeader";
import TableFillerRows from "@/components/TableFillerRows";
import {
  countResumes,
  deleteResume,
  duplicateResume,
  listResumes,
  renameResume,
  RESUMES_PAGE_SIZE,
  type ResumeRow,
  type ResumeSort,
} from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, {
    dateStyle: "medium",
  });
}

export default function MyResumesPage() {
  const { t, i18n } = useTranslation();
  const { notifyResumeListChanged } = useAppState();
  const [supabase] = useState(() => createClient());
  const [resumes, setResumes] = useState<ResumeRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<ResumeSort>({
    column: "updated_at",
    ascending: true,
  });
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);
  const requestIdRef = useRef(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / RESUMES_PAGE_SIZE));

  async function loadPage(pageNumber: number, sortOverride: ResumeSort = sort) {
    const requestId = ++requestIdRef.current;
    try {
      const userId = await ensureUserId(supabase);
      const [rows, count] = await Promise.all([
        listResumes(supabase, userId, pageNumber, RESUMES_PAGE_SIZE, sortOverride),
        countResumes(supabase, userId),
      ]);
      if (requestId !== requestIdRef.current) return;
      setResumes(rows);
      setTotalCount(count);
      setPage(pageNumber);
      setSort(sortOverride);
    } catch (error) {
      console.error(error);
      if (requestId === requestIdRef.current) setLoadFailed(true);
    }
  }

  function handleSort(column: ResumeSort["column"]) {
    const ascending = sort.column === column ? !sort.ascending : true;
    loadPage(1, { column, ascending });
  }

  useEffect(() => {
    (async () => {
      await loadPage(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmDelete"),
      confirmLabel: t("myResumes.delete"),
    });
    if (!confirmed) return;
    await deleteResume(supabase, id);
    notifyResumeListChanged();
    const isLastRowOnPage = resumes?.length === 1 && page > 1;
    await loadPage(isLastRowOnPage ? page - 1 : page);
  }

  async function handleRename(row: ResumeRow) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    await renameResume(supabase, row.id, newName);
    await loadPage(page);
  }

  async function handleDuplicate(id: string) {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      await duplicateResume(supabase, id, await ensureUserId(supabase));
      notifyResumeListChanged();
      await loadPage(1);
    } catch (error) {
      console.error(error);
      alert(t("myResumes.duplicateFailed"));
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t("myResumes.pageTitle")}</h1>
          <Link href="/app" className="btn btn-primary">
            {t("myResumes.newResume")}
          </Link>
        </div>

        {loadFailed && (
          <p className="text-error">{t("myResumes.loadFailed")}</p>
        )}

        {!loadFailed && resumes && resumes.length === 0 && (
          <p className="text-base-content/60">{t("myResumes.empty")}</p>
        )}

        {!loadFailed && resumes && resumes.length > 0 && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th className="min-w-40">
                    <SortableColumnHeader
                      label={t("myResumes.name")}
                      column="name"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByName")}
                    />
                  </th>
                  <th className="min-w-32">
                    <SortableColumnHeader
                      label={t("myResumes.created")}
                      column="created_at"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByCreated")}
                    />
                  </th>
                  <th className="min-w-32">
                    <SortableColumnHeader
                      label={t("myResumes.updated")}
                      column="updated_at"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByUpdated")}
                    />
                  </th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((row) => (
                  <tr key={row.id}>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.name || t("myResumes.untitled")}
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
                        {t("myResumes.rename")}
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
                        {t("myResumes.duplicate")}
                      </button>
                    </td>
                    <td className="w-px">
                      <Link
                        href={`/app?resumeId=${row.id}&template=${row.templateId}`}
                        className="btn btn-outline btn-sm"
                      >
                        <PencilSquareIcon className="h-4 w-4 stroke-current" />
                        {t("myResumes.edit")}
                      </Link>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <TrashIcon className="h-4 w-4 stroke-current" />
                        {t("myResumes.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
                {totalPages > 1 && (
                  <TableFillerRows
                    count={RESUMES_PAGE_SIZE - resumes.length}
                    textColumns={3}
                    actionColumns={4}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadFailed && resumes && resumes.length > 0 && (
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
      <SaveResumeDialog ref={renameDialogRef} />
    </div>
  );
}
