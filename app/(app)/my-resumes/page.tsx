"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { Temporal } from "temporal-polyfill";
import { useAppState } from "@/components/AppState";
import ConfirmDialog, {
  type ConfirmDialogHandle,
} from "@/components/ConfirmDialog";
import {
  DuplicateIcon,
  PencilIcon,
  PencilSquareIcon,
  RestoreIcon,
  TrashIcon,
} from "@/components/Icons";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import SortableColumnHeader from "@/components/SortableColumnHeader";
import TableFillerRows from "@/components/TableFillerRows";
import { useToast } from "@/components/Toast";
import { FREE_TIER_LIMITS, RESUMES_PAGE_SIZE } from "@/lib/constants";
import {
  countDeletedResumes,
  countResumes,
  deleteResume,
  deleteResumes,
  duplicateResume,
  listDeletedResumes,
  listResumes,
  permanentlyDeleteResume,
  permanentlyDeleteResumes,
  renameResume,
  restoreResume,
  restoreResumes,
  type ResumeRow,
  type ResumeSort,
} from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";
import { getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";

type Tab = "active" | "deleted";

const DEFAULT_ACTIVE_SORT: ResumeSort = { column: "updated_at", ascending: true };
const DEFAULT_DELETED_SORT: ResumeSort = { column: "deleted_at", ascending: false };

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, {
    dateStyle: "medium",
  });
}

export default function MyResumesPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { notifyResumeListChanged } = useAppState();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [resumes, setResumes] = useState<ResumeRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingForeverId, setDeletingForeverId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  const [isBulkDeletingForever, setIsBulkDeletingForever] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [sort, setSort] = useState<ResumeSort>(DEFAULT_ACTIVE_SORT);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);
  const requestIdRef = useRef(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / RESUMES_PAGE_SIZE));

  async function loadPage(
    pageNumber: number,
    sortOverride: ResumeSort = sort,
    tab: Tab = activeTab,
  ) {
    const requestId = ++requestIdRef.current;
    try {
      const userId = await ensureUserId(supabase);
      const [rows, count] =
        tab === "active"
          ? await Promise.all([
              listResumes(supabase, userId, pageNumber, RESUMES_PAGE_SIZE, sortOverride),
              countResumes(supabase, userId),
            ])
          : await Promise.all([
              listDeletedResumes(supabase, userId, pageNumber, RESUMES_PAGE_SIZE, sortOverride),
              countDeletedResumes(supabase, userId),
            ]);
      if (requestId !== requestIdRef.current) return;
      setResumes(rows);
      setTotalCount(count);
      setPage(pageNumber);
      setSort(sortOverride);
      setSelectedIds(new Set());
      if (tab === "deleted") setDeletedCount(count);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      if (requestId === requestIdRef.current) setLoadFailed(true);
    }
  }

  async function refreshDeletedCount() {
    const userId = await ensureUserId(supabase);
    setDeletedCount(await countDeletedResumes(supabase, userId));
  }

  function handleTabChange(tab: Tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    loadPage(1, tab === "active" ? DEFAULT_ACTIVE_SORT : DEFAULT_DELETED_SORT, tab);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (resumes && resumes.every((row) => prev.has(row.id))) return new Set();
      return new Set(resumes?.map((row) => row.id));
    });
  }

  async function handleBulkDelete() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmBulkDelete", { count: selectedIds.size }),
      confirmLabel: t("myResumes.deleteSelected"),
    });
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await deleteResumes(supabase, Array.from(selectedIds));
      notifyResumeListChanged();
      const remainingOnPage = (resumes?.length ?? 0) - selectedIds.size;
      const targetPage = remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await Promise.all([loadPage(targetPage), refreshDeletedCount()]);
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleBulkRestore() {
    setIsBulkRestoring(true);
    try {
      const userId = await ensureUserId(supabase);
      const [subscription, activeCount] = await Promise.all([
        getSubscription(supabase, userId),
        countResumes(supabase, userId),
      ]);
      if (
        !isPaidPlan(subscription.plan) &&
        activeCount + selectedIds.size > FREE_TIER_LIMITS.resumes
      ) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t("pricing.resumeLimitReached", { limit: FREE_TIER_LIMITS.resumes }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await restoreResumes(supabase, Array.from(selectedIds));
      notifyResumeListChanged();
      showToast(t("myResumes.restored"), "success");
      const remainingOnPage = (resumes?.length ?? 0) - selectedIds.size;
      const targetPage = remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await loadPage(targetPage, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t("myResumes.restoreFailed"), "error");
    } finally {
      setIsBulkRestoring(false);
    }
  }

  async function handleBulkDeleteForever() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmBulkDeleteForever", { count: selectedIds.size }),
      confirmLabel: t("myResumes.deleteForeverSelected"),
    });
    if (!confirmed) return;
    setIsBulkDeletingForever(true);
    try {
      await permanentlyDeleteResumes(supabase, Array.from(selectedIds));
      const remainingOnPage = (resumes?.length ?? 0) - selectedIds.size;
      const targetPage = remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await loadPage(targetPage, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t("myResumes.deleteForeverFailed"), "error");
    } finally {
      setIsBulkDeletingForever(false);
    }
  }

  function handleSort(column: ResumeSort["column"]) {
    const ascending = sort.column === column ? !sort.ascending : true;
    loadPage(1, { column, ascending }, activeTab);
  }

  useEffect(() => {
    (async () => {
      await Promise.all([loadPage(1), refreshDeletedCount()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmDelete"),
      confirmLabel: t("myResumes.delete"),
    });
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteResume(supabase, id);
      notifyResumeListChanged();
      const isLastRowOnPage = resumes?.length === 1 && page > 1;
      await Promise.all([loadPage(isLastRowOnPage ? page - 1 : page), refreshDeletedCount()]);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      const userId = await ensureUserId(supabase);
      const [subscription, activeCount] = await Promise.all([
        getSubscription(supabase, userId),
        countResumes(supabase, userId),
      ]);
      if (!isPaidPlan(subscription.plan) && activeCount >= FREE_TIER_LIMITS.resumes) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t("pricing.resumeLimitReached", { limit: FREE_TIER_LIMITS.resumes }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await restoreResume(supabase, id);
      notifyResumeListChanged();
      showToast(t("myResumes.restored"), "success");
      const isLastRowOnPage = resumes?.length === 1 && page > 1;
      await loadPage(isLastRowOnPage ? page - 1 : page, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t("myResumes.restoreFailed"), "error");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDeleteForever(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmDeleteForever"),
      confirmLabel: t("myResumes.deleteForever"),
    });
    if (!confirmed) return;
    setDeletingForeverId(id);
    try {
      await permanentlyDeleteResume(supabase, id);
      const isLastRowOnPage = resumes?.length === 1 && page > 1;
      await loadPage(isLastRowOnPage ? page - 1 : page, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t("myResumes.deleteForeverFailed"), "error");
    } finally {
      setDeletingForeverId(null);
    }
  }

  async function handleRename(row: ResumeRow) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    setRenamingId(row.id);
    try {
      await renameResume(supabase, row.id, newName);
      await loadPage(page);
    } finally {
      setRenamingId(null);
    }
  }

  async function handleDuplicate(id: string) {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      const userId = await ensureUserId(supabase);
      const [subscription, existingCount] = await Promise.all([
        getSubscription(supabase, userId),
        countResumes(supabase, userId),
      ]);
      if (!isPaidPlan(subscription.plan) && existingCount >= FREE_TIER_LIMITS.resumes) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t("pricing.resumeLimitReached", { limit: FREE_TIER_LIMITS.resumes }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await duplicateResume(supabase, id, userId);
      notifyResumeListChanged();
      await loadPage(1);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t("myResumes.duplicateFailed"));
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t("myResumes.pageTitle")}</h1>
          <div className="flex items-center gap-2">
            {activeTab === "active" && selectedIds.size > 0 && (
              <>
                <span className="text-base-content/60 text-sm">
                  <Trans
                    i18nKey="myResumes.selectedCount"
                    count={selectedIds.size}
                    components={{ bold: <span className="text-base font-bold" /> }}
                  />
                </span>
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDelete}
                >
                  {isBulkDeleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <TrashIcon className="h-4 w-4 stroke-current" />
                  )}
                  {t("myResumes.deleteSelected")}
                </button>
              </>
            )}
            {activeTab === "deleted" && selectedIds.size > 0 && (
              <>
                <span className="text-base-content/60 text-sm">
                  <Trans
                    i18nKey="myResumes.selectedCount"
                    count={selectedIds.size}
                    components={{ bold: <span className="text-base font-bold" /> }}
                  />
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={isBulkRestoring}
                  onClick={handleBulkRestore}
                >
                  {isBulkRestoring ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <RestoreIcon className="h-4 w-4 stroke-current" />
                  )}
                  {t("myResumes.restoreSelected")}
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-sm whitespace-nowrap"
                  disabled={isBulkDeletingForever}
                  onClick={handleBulkDeleteForever}
                >
                  {isBulkDeletingForever ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <TrashIcon className="h-4 w-4 stroke-current" />
                  )}
                  {t("myResumes.deleteForeverSelected")}
                </button>
              </>
            )}
            <Link href="/app" className="btn btn-primary">
              {t("myResumes.newResume")}
            </Link>
          </div>
        </div>

        <div role="tablist" className="tabs tabs-lift mb-6 w-fit">
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "active" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("active")}
          >
            {t("myResumes.activeTab")}
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "deleted" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("deleted")}
          >
            {t("myResumes.recentlyDeletedTab")}
            {deletedCount > 0 && ` (${deletedCount})`}
          </button>
        </div>

        {loadFailed && (
          <p className="text-error">{t("myResumes.loadFailed")}</p>
        )}

        {!loadFailed && resumes === null && (
          <div className="flex flex-1 items-center justify-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!loadFailed && resumes && resumes.length === 0 && (
          <p className="text-base-content/60">
            {activeTab === "active" ? t("myResumes.empty") : t("myResumes.deletedEmpty")}
          </p>
        )}

        {!loadFailed && resumes && resumes.length > 0 && activeTab === "active" && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-px">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      aria-label={t("aria.selectAll")}
                      checked={resumes.every((row) => selectedIds.has(row.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                    <td className="w-px">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        aria-label={t("aria.selectRow", {
                          name: row.name || t("myResumes.untitled"),
                        })}
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
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
                        disabled={renamingId === row.id}
                        onClick={() => handleRename(row)}
                      >
                        {renamingId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <PencilIcon className="h-4 w-4 stroke-current" />
                        )}
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
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        {deletingId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <TrashIcon className="h-4 w-4 stroke-current" />
                        )}
                        {t("myResumes.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
                {totalPages > 1 && (
                  <TableFillerRows
                    count={RESUMES_PAGE_SIZE - resumes.length}
                    checkboxColumn
                    textColumns={3}
                    actionColumns={4}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadFailed && resumes && resumes.length > 0 && activeTab === "deleted" && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-px">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      aria-label={t("aria.selectAll")}
                      checked={resumes.every((row) => selectedIds.has(row.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                      label={t("myResumes.deletedOn")}
                      column="deleted_at"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByDeleted")}
                    />
                  </th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((row) => (
                  <tr key={row.id}>
                    <td className="w-px">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        aria-label={t("aria.selectRow", {
                          name: row.name || t("myResumes.untitled"),
                        })}
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.name || t("myResumes.untitled")}
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.deletedAt ? formatDate(row.deletedAt, i18n.language) : ""}
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={restoringId === row.id}
                        onClick={() => handleRestore(row.id)}
                      >
                        {restoringId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <RestoreIcon className="h-4 w-4 stroke-current" />
                        )}
                        {t("myResumes.restore")}
                      </button>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error whitespace-nowrap"
                        disabled={deletingForeverId === row.id}
                        onClick={() => handleDeleteForever(row.id)}
                      >
                        {deletingForeverId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <TrashIcon className="h-4 w-4 stroke-current" />
                        )}
                        {t("myResumes.deleteForever")}
                      </button>
                    </td>
                  </tr>
                ))}
                {totalPages > 1 && (
                  <TableFillerRows
                    count={RESUMES_PAGE_SIZE - resumes.length}
                    checkboxColumn
                    textColumns={2}
                    actionColumns={2}
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
