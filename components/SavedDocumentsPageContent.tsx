"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { DocumentQueryKeys } from "@/lib/queries/keys";
import { useSubscriptionQuery } from "@/lib/queries/subscriptions";
import { useUserIdQuery } from "@/lib/queries/session";
import { createClient } from "@/lib/supabase/client";
import { isPaidPlan } from "@/lib/supabase/subscriptions";
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
  queryKeys: DocumentQueryKeys;
  pageSize: number;
  freeTierLimit: number;
  newDocumentHref: string;
  getEditHref: (row: Row) => string;
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
  queryKeys,
  pageSize,
  freeTierLimit,
  newDocumentHref,
  getEditHref,
}: SavedDocumentsPageContentProps<Row, Sort>) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());
  const { data: userId } = useUserIdQuery(supabase);
  const { data: subscription } = useSubscriptionQuery(supabase, userId);
  const [activeTab, setActiveTab] = useState<ListTab>("active");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>(DEFAULT_ACTIVE_SORT as Sort);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);

  const countQuery = useQuery({
    queryKey: queryKeys.count(userId ?? ""),
    queryFn: () => api.count(supabase, userId!),
    enabled: !!userId,
  });
  const deletedCountQuery = useQuery({
    queryKey: queryKeys.deletedCount(userId ?? ""),
    queryFn: () => api.countDeleted(supabase, userId!),
    enabled: !!userId,
  });
  const listQuery = useQuery({
    queryKey: queryKeys.list(userId ?? "", activeTab, sort, page),
    queryFn: () =>
      activeTab === "active"
        ? api.list(supabase, userId!, page, pageSize, sort)
        : api.listDeleted(supabase, userId!, page, pageSize, sort),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  const documents = listQuery.data ?? null;
  const loadFailed = listQuery.isError || countQuery.isError || deletedCountQuery.isError;
  const deletedCount = deletedCountQuery.data ?? 0;
  const totalCount = activeTab === "active" ? (countQuery.data ?? 0) : deletedCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function invalidateAll() {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.all(userId) });
  }

  function goToPage(pageNumber: number) {
    setPage(pageNumber);
    setSelectedIds(new Set());
  }

  function handleTabChange(tab: ListTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSort((tab === "active" ? DEFAULT_ACTIVE_SORT : DEFAULT_DELETED_SORT) as Sort);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleSort(column: Sort["column"]) {
    const ascending = sort.column === column ? !sort.ascending : true;
    setSort({ column, ascending } as Sort);
    setPage(1);
    setSelectedIds(new Set());
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteOne(supabase, id),
    onSuccess: invalidateAll,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.deleteMany(supabase, ids),
    onSuccess: invalidateAll,
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string): Promise<{ restored: boolean }> => {
      if (!userId) return { restored: false };
      const activeCount = countQuery.data ?? 0;
      if (subscription && !isPaidPlan(subscription.plan) && activeCount >= freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return { restored: false };
      }
      await api.restoreOne(supabase, id);
      return { restored: true };
    },
    onSuccess: (result) => {
      if (!result.restored) return;
      invalidateAll();
      showToast(t(labels.restored), "success");
    },
    onError: () => showToast(t(labels.restoreFailed), "error"),
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<{ restored: boolean }> => {
      if (!userId) return { restored: false };
      const activeCount = countQuery.data ?? 0;
      if (subscription && !isPaidPlan(subscription.plan) && activeCount + ids.length > freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return { restored: false };
      }
      await api.restoreMany(supabase, ids);
      return { restored: true };
    },
    onSuccess: (result) => {
      if (!result.restored) return;
      invalidateAll();
      showToast(t(labels.restored), "success");
    },
    onError: () => showToast(t(labels.restoreFailed), "error"),
  });

  const permanentlyDeleteMutation = useMutation({
    mutationFn: (id: string) => api.permanentlyDeleteOne(supabase, id),
    onSuccess: invalidateAll,
    onError: () => showToast(t(labels.deleteForeverFailed), "error"),
  });

  const bulkPermanentlyDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.permanentlyDeleteMany(supabase, ids),
    onSuccess: invalidateAll,
    onError: () => showToast(t(labels.deleteForeverFailed), "error"),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.rename(supabase, id, name),
    onSuccess: invalidateAll,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string): Promise<{ duplicated: boolean }> => {
      if (!userId) return { duplicated: false };
      const existingCount = countQuery.data ?? 0;
      if (subscription && !isPaidPlan(subscription.plan) && existingCount >= freeTierLimit) {
        const viewPlans = await confirmDialogRef.current?.open({
          message: t(labels.limitReached, { limit: freeTierLimit }),
          confirmLabel: t("pricing.viewPlans"),
        });
        if (viewPlans) router.push("/#pricing");
        return { duplicated: false };
      }
      await api.duplicate(supabase, id, userId);
      return { duplicated: true };
    },
    onSuccess: (result) => {
      if (!result.duplicated) return;
      invalidateAll();
    },
    onError: () => alert(t(labels.duplicateFailed)),
  });

  async function handleBulkDelete() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmBulkDelete, { count: selectedIds.size }),
      confirmLabel: t(labels.deleteSelected),
    });
    if (!confirmed) return;
    const ids = Array.from(selectedIds);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      const remainingOnPage = (documents?.length ?? 0) - ids.length;
      setSelectedIds(new Set());
      if (remainingOnPage <= 0 && page > 1) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleBulkRestore() {
    const ids = Array.from(selectedIds);
    try {
      const result = await bulkRestoreMutation.mutateAsync(ids);
      if (!result.restored) return;
      const remainingOnPage = (documents?.length ?? 0) - ids.length;
      setSelectedIds(new Set());
      if (remainingOnPage <= 0 && page > 1) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleBulkDeleteForever() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmBulkDeleteForever, { count: selectedIds.size }),
      confirmLabel: t(labels.deleteForeverSelected),
    });
    if (!confirmed) return;
    const ids = Array.from(selectedIds);
    try {
      await bulkPermanentlyDeleteMutation.mutateAsync(ids);
      const remainingOnPage = (documents?.length ?? 0) - ids.length;
      setSelectedIds(new Set());
      if (remainingOnPage <= 0 && page > 1) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmDelete),
      confirmLabel: t(labels.delete),
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      const isLastRowOnPage = documents?.length === 1 && page > 1;
      if (isLastRowOnPage) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleRestore(id: string) {
    try {
      const result = await restoreMutation.mutateAsync(id);
      if (!result.restored) return;
      const isLastRowOnPage = documents?.length === 1 && page > 1;
      if (isLastRowOnPage) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleDeleteForever(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t(labels.confirmDeleteForever),
      confirmLabel: t(labels.deleteForever),
    });
    if (!confirmed) return;
    try {
      await permanentlyDeleteMutation.mutateAsync(id);
      const isLastRowOnPage = documents?.length === 1 && page > 1;
      if (isLastRowOnPage) setPage(page - 1);
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleRename(row: Row) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    try {
      await renameMutation.mutateAsync({ id: row.id, name: newName });
    } catch {
      // Reported centrally via the query client's mutation cache.
    }
  }

  async function handleDuplicate(id: string) {
    if (duplicateMutation.isPending) return;
    try {
      const result = await duplicateMutation.mutateAsync(id);
      if (result.duplicated) goToPage(1);
    } catch {
      // Reported centrally via the query client's mutation cache; the user
      // already saw the alert() in onError above.
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
                  disabled={bulkDeleteMutation.isPending}
                  onClick={handleBulkDelete}
                >
                  {bulkDeleteMutation.isPending ? (
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
                  disabled={bulkRestoreMutation.isPending}
                  onClick={handleBulkRestore}
                >
                  {bulkRestoreMutation.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <RestoreIcon className="h-4 w-4 stroke-current" />
                  )}
                  {t(labels.restoreSelected)}
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-sm whitespace-nowrap"
                  disabled={bulkPermanentlyDeleteMutation.isPending}
                  onClick={handleBulkDeleteForever}
                >
                  {bulkPermanentlyDeleteMutation.isPending ? (
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
                        disabled={renameMutation.isPending && renameMutation.variables?.id === row.id}
                        onClick={() => handleRename(row)}
                      >
                        {renameMutation.isPending && renameMutation.variables?.id === row.id ? (
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
                        disabled={duplicateMutation.isPending && duplicateMutation.variables === row.id}
                        onClick={() => handleDuplicate(row.id)}
                      >
                        {duplicateMutation.isPending && duplicateMutation.variables === row.id ? (
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
                        disabled={deleteMutation.isPending && deleteMutation.variables === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === row.id ? (
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
                        disabled={restoreMutation.isPending && restoreMutation.variables === row.id}
                        onClick={() => handleRestore(row.id)}
                      >
                        {restoreMutation.isPending && restoreMutation.variables === row.id ? (
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
                        disabled={
                          permanentlyDeleteMutation.isPending &&
                          permanentlyDeleteMutation.variables === row.id
                        }
                        onClick={() => handleDeleteForever(row.id)}
                      >
                        {permanentlyDeleteMutation.isPending &&
                        permanentlyDeleteMutation.variables === row.id ? (
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
              onClick={() => goToPage(page - 1)}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`join-item btn ${pageNumber === page ? "btn-primary" : ""}`}
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="join-item btn"
              aria-label={t("aria.nextPage")}
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
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
