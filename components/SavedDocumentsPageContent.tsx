"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { Temporal } from "temporal-polyfill";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import {
  DuplicateIcon,
  PencilIcon,
  PencilSquareIcon,
  RestoreIcon,
  TrashIcon,
} from "@/components/Icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import SaveResumeDialog, { type SaveResumeDialogHandle } from "@/components/SaveResumeDialog";
import SortableColumnHeader from "@/components/SortableColumnHeader";
import TableFillerRows from "@/components/TableFillerRows";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";
import { getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ListTab } from "@/types/ui";

export interface SavedDocumentRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SavedDocumentSort {
  column: "name" | "created_at" | "updated_at" | "deleted_at";
  ascending: boolean;
}

export interface SavedDocumentsLabels {
  pageTitle: string;
  newDocument: string;
  activeTab: string;
  recentlyDeletedTab: string;
  loadFailed: string;
  empty: string;
  deletedEmpty: string;
  name: string;
  created: string;
  updated: string;
  deletedOn: string;
  untitled: string;
  rename: string;
  duplicate: string;
  edit: string;
  delete: string;
  restore: string;
  deleteForever: string;
  selectedCount: string;
  deleteSelected: string;
  restoreSelected: string;
  deleteForeverSelected: string;
  confirmDelete: string;
  confirmDeleteForever: string;
  confirmBulkDelete: string;
  confirmBulkDeleteForever: string;
  restored: string;
  restoreFailed: string;
  deleteForeverFailed: string;
  duplicateFailed: string;
  limitReached: string;
  dialogTitle: string;
  dialogPlaceholder: string;
  dialogTooLongMessage: string;
}

export interface SavedDocumentsApi<Row extends SavedDocumentRow, Sort extends SavedDocumentSort> {
  list: (
    supabase: SupabaseClient<Database>,
    userId: string,
    page: number,
    pageSize: number,
    sort: Sort,
  ) => Promise<Row[]>;
  listDeleted: (
    supabase: SupabaseClient<Database>,
    userId: string,
    page: number,
    pageSize: number,
    sort: Sort,
  ) => Promise<Row[]>;
  count: (supabase: SupabaseClient<Database>, userId: string) => Promise<number>;
  countDeleted: (supabase: SupabaseClient<Database>, userId: string) => Promise<number>;
  deleteOne: (supabase: SupabaseClient<Database>, id: string) => Promise<void>;
  deleteMany: (supabase: SupabaseClient<Database>, ids: string[]) => Promise<void>;
  restoreOne: (supabase: SupabaseClient<Database>, id: string) => Promise<void>;
  restoreMany: (supabase: SupabaseClient<Database>, ids: string[]) => Promise<void>;
  permanentlyDeleteOne: (supabase: SupabaseClient<Database>, id: string) => Promise<void>;
  permanentlyDeleteMany: (supabase: SupabaseClient<Database>, ids: string[]) => Promise<void>;
  rename: (supabase: SupabaseClient<Database>, id: string, name: string) => Promise<void>;
  duplicate: (supabase: SupabaseClient<Database>, id: string, userId: string) => Promise<unknown>;
}

export interface SavedDocumentsPageContentProps<
  Row extends SavedDocumentRow,
  Sort extends SavedDocumentSort,
> {
  labels: SavedDocumentsLabels;
  api: SavedDocumentsApi<Row, Sort>;
  pageSize: number;
  freeTierLimit: number;
  newDocumentHref: string;
  getEditHref: (row: Row) => string;
  notifyListChanged: () => void;
}

const DEFAULT_ACTIVE_SORT: SavedDocumentSort = { column: "updated_at", ascending: true };
const DEFAULT_DELETED_SORT: SavedDocumentSort = { column: "deleted_at", ascending: false };

function formatDate(iso: string, locale: string): string {
  return Temporal.Instant.from(iso).toLocaleString(locale, { dateStyle: "medium" });
}

export default function SavedDocumentsPageContent<
  Row extends SavedDocumentRow,
  Sort extends SavedDocumentSort,
>({
  labels,
  api,
  pageSize,
  freeTierLimit,
  newDocumentHref,
  getEditHref,
  notifyListChanged,
}: SavedDocumentsPageContentProps<Row, Sort>) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<ListTab>("active");
  const [documents, setDocuments] = useState<Row[] | null>(null);
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
  const [sort, setSort] = useState<Sort>(DEFAULT_ACTIVE_SORT as Sort);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);
  const requestIdRef = useRef(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  async function loadPage(pageNumber: number, sortOverride: Sort = sort, tab: ListTab = activeTab) {
    const requestId = ++requestIdRef.current;
    try {
      const userId = await ensureUserId(supabase);
      const [rows, count] =
        tab === "active"
          ? await Promise.all([
              api.list(supabase, userId, pageNumber, pageSize, sortOverride),
              api.count(supabase, userId),
            ])
          : await Promise.all([
              api.listDeleted(supabase, userId, pageNumber, pageSize, sortOverride),
              api.countDeleted(supabase, userId),
            ]);
      if (requestId !== requestIdRef.current) return;
      setDocuments(rows);
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
    setDeletedCount(await api.countDeleted(supabase, userId));
  }

  function handleTabChange(tab: ListTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    loadPage(1, (tab === "active" ? DEFAULT_ACTIVE_SORT : DEFAULT_DELETED_SORT) as Sort, tab);
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
      if (documents && documents.every((row) => prev.has(row.id))) return new Set();
      return new Set(documents?.map((row) => row.id));
    });
  }

  async function handleBulkDelete() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmBulkDelete, { count: selectedIds.size }),
      confirmLabel: t(labels.deleteSelected),
    });
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await api.deleteMany(supabase, Array.from(selectedIds));
      notifyListChanged();
      const remainingOnPage = (documents?.length ?? 0) - selectedIds.size;
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
        api.count(supabase, userId),
      ]);
      if (!isPaidPlan(subscription.plan) && activeCount + selectedIds.size > freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await api.restoreMany(supabase, Array.from(selectedIds));
      notifyListChanged();
      showToast(t(labels.restored), "success");
      const remainingOnPage = (documents?.length ?? 0) - selectedIds.size;
      const targetPage = remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await loadPage(targetPage, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t(labels.restoreFailed), "error");
    } finally {
      setIsBulkRestoring(false);
    }
  }

  async function handleBulkDeleteForever() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmBulkDeleteForever, { count: selectedIds.size }),
      confirmLabel: t(labels.deleteForeverSelected),
    });
    if (!confirmed) return;
    setIsBulkDeletingForever(true);
    try {
      await api.permanentlyDeleteMany(supabase, Array.from(selectedIds));
      const remainingOnPage = (documents?.length ?? 0) - selectedIds.size;
      const targetPage = remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await loadPage(targetPage, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t(labels.deleteForeverFailed), "error");
    } finally {
      setIsBulkDeletingForever(false);
    }
  }

  function handleSort(column: Sort["column"]) {
    const ascending = sort.column === column ? !sort.ascending : true;
    loadPage(1, { column, ascending } as Sort, activeTab);
  }

  useEffect(() => {
    (async () => {
      await Promise.all([loadPage(1), refreshDeletedCount()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmDelete),
      confirmLabel: t(labels.delete),
    });
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await api.deleteOne(supabase, id);
      notifyListChanged();
      const isLastRowOnPage = documents?.length === 1 && page > 1;
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
        api.count(supabase, userId),
      ]);
      if (!isPaidPlan(subscription.plan) && activeCount >= freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await api.restoreOne(supabase, id);
      notifyListChanged();
      showToast(t(labels.restored), "success");
      const isLastRowOnPage = documents?.length === 1 && page > 1;
      await loadPage(isLastRowOnPage ? page - 1 : page, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t(labels.restoreFailed), "error");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDeleteForever(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmDeleteForever),
      confirmLabel: t(labels.deleteForever),
    });
    if (!confirmed) return;
    setDeletingForeverId(id);
    try {
      await api.permanentlyDeleteOne(supabase, id);
      const isLastRowOnPage = documents?.length === 1 && page > 1;
      await loadPage(isLastRowOnPage ? page - 1 : page, sort, "deleted");
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      showToast(t(labels.deleteForeverFailed), "error");
    } finally {
      setDeletingForeverId(null);
    }
  }

  async function handleRename(row: Row) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    setRenamingId(row.id);
    try {
      await api.rename(supabase, row.id, newName);
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
        api.count(supabase, userId),
      ]);
      if (!isPaidPlan(subscription.plan) && existingCount >= freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return;
      }
      await api.duplicate(supabase, id, userId);
      notifyListChanged();
      await loadPage(1);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t(labels.duplicateFailed));
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t(labels.pageTitle)}</h1>
          <div className="flex items-center gap-2">
            {activeTab === "active" && selectedIds.size > 0 && (
              <>
                <span className="text-base-content/60 text-sm">
                  <Trans
                    i18nKey={labels.selectedCount}
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
                  {t(labels.deleteSelected)}
                </button>
              </>
            )}
            {activeTab === "deleted" && selectedIds.size > 0 && (
              <>
                <span className="text-base-content/60 text-sm">
                  <Trans
                    i18nKey={labels.selectedCount}
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
                  {t(labels.restoreSelected)}
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
                  {t(labels.deleteForeverSelected)}
                </button>
              </>
            )}
            <Link href={newDocumentHref} className="btn btn-primary">
              {t(labels.newDocument)}
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
            {t(labels.activeTab)}
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "deleted" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("deleted")}
          >
            {t(labels.recentlyDeletedTab)}
            {deletedCount > 0 && ` (${deletedCount})`}
          </button>
        </div>

        {loadFailed && <p className="text-error">{t(labels.loadFailed)}</p>}

        {!loadFailed && documents === null && <LoadingSpinner />}

        {!loadFailed && documents && documents.length === 0 && (
          <p className="text-base-content/60">
            {activeTab === "active" ? t(labels.empty) : t(labels.deletedEmpty)}
          </p>
        )}

        {!loadFailed && documents && documents.length > 0 && activeTab === "active" && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-px">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      aria-label={t("aria.selectAll")}
                      checked={documents.every((row) => selectedIds.has(row.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="min-w-40">
                    <SortableColumnHeader
                      label={t(labels.name)}
                      column="name"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByName")}
                    />
                  </th>
                  <th className="min-w-32">
                    <SortableColumnHeader
                      label={t(labels.created)}
                      column="created_at"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByCreated")}
                    />
                  </th>
                  <th className="min-w-32">
                    <SortableColumnHeader
                      label={t(labels.updated)}
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
                {documents.map((row) => (
                  <tr key={row.id}>
                    <td className="w-px">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        aria-label={t("aria.selectRow", { name: row.name || t(labels.untitled) })}
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.name || t(labels.untitled)}
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
                        {t(labels.rename)}
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
                        {t(labels.duplicate)}
                      </button>
                    </td>
                    <td className="w-px">
                      <Link href={getEditHref(row)} className="btn btn-outline btn-sm">
                        <PencilSquareIcon className="h-4 w-4 stroke-current" />
                        {t(labels.edit)}
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
                        {t(labels.delete)}
                      </button>
                    </td>
                  </tr>
                ))}
                {totalPages > 1 && (
                  <TableFillerRows
                    count={pageSize - documents.length}
                    checkboxColumn
                    textColumns={3}
                    actionColumns={4}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadFailed && documents && documents.length > 0 && activeTab === "deleted" && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-px">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      aria-label={t("aria.selectAll")}
                      checked={documents.every((row) => selectedIds.has(row.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="min-w-40">
                    <SortableColumnHeader
                      label={t(labels.name)}
                      column="name"
                      sort={sort}
                      onSort={handleSort}
                      ariaLabel={t("aria.sortByName")}
                    />
                  </th>
                  <th className="min-w-32">
                    <SortableColumnHeader
                      label={t(labels.deletedOn)}
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
                {documents.map((row) => (
                  <tr key={row.id}>
                    <td className="w-px">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        aria-label={t("aria.selectRow", { name: row.name || t(labels.untitled) })}
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="text-base-content/60 whitespace-nowrap">
                      {row.name || t(labels.untitled)}
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
                        {t(labels.restore)}
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
                        {t(labels.deleteForever)}
                      </button>
                    </td>
                  </tr>
                ))}
                {totalPages > 1 && (
                  <TableFillerRows
                    count={pageSize - documents.length}
                    checkboxColumn
                    textColumns={2}
                    actionColumns={2}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadFailed && documents && documents.length > 0 && (
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
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`join-item btn ${pageNumber === page ? "btn-primary" : ""}`}
                onClick={() => loadPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
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
        title={t(labels.dialogTitle)}
        placeholder={t(labels.dialogPlaceholder)}
        untitledFallback={t(labels.untitled)}
        tooLongMessage={t(labels.dialogTooLongMessage)}
      />
    </div>
  );
}
