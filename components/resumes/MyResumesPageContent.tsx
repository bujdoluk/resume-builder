"use client";

import { useAppState } from "@/components/AppState";
import SavedDocumentsPageContent, {
  type SavedDocumentsApi,
  type SavedDocumentsLabels,
} from "@/components/SavedDocumentsPageContent";
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
} from "@/lib/supabase/resumes";
import type { ResumeRow, ResumeSort } from "@/types/resume";

const labels: SavedDocumentsLabels = {
  pageTitle: "myResumes.pageTitle",
  newDocument: "myResumes.newResume",
  activeTab: "myResumes.activeTab",
  recentlyDeletedTab: "myResumes.recentlyDeletedTab",
  loadFailed: "myResumes.loadFailed",
  empty: "myResumes.empty",
  deletedEmpty: "myResumes.deletedEmpty",
  name: "myResumes.name",
  created: "myResumes.created",
  updated: "myResumes.updated",
  deletedOn: "myResumes.deletedOn",
  untitled: "myResumes.untitled",
  rename: "myResumes.rename",
  duplicate: "myResumes.duplicate",
  edit: "myResumes.edit",
  delete: "myResumes.delete",
  restore: "myResumes.restore",
  deleteForever: "myResumes.deleteForever",
  selectedCount: "myResumes.selectedCount",
  deleteSelected: "myResumes.deleteSelected",
  restoreSelected: "myResumes.restoreSelected",
  deleteForeverSelected: "myResumes.deleteForeverSelected",
  confirmDelete: "myResumes.confirmDelete",
  confirmDeleteForever: "myResumes.confirmDeleteForever",
  confirmBulkDelete: "myResumes.confirmBulkDelete",
  confirmBulkDeleteForever: "myResumes.confirmBulkDeleteForever",
  restored: "myResumes.restored",
  restoreFailed: "myResumes.restoreFailed",
  deleteForeverFailed: "myResumes.deleteForeverFailed",
  duplicateFailed: "myResumes.duplicateFailed",
  limitReached: "pricing.resumeLimitReached",
  dialogTitle: "myResumes.nameDialogTitle",
  dialogPlaceholder: "myResumes.namePlaceholder",
  dialogTooLongMessage: "myResumes.nameTooLong",
};

const api: SavedDocumentsApi<ResumeRow, ResumeSort> = {
  list: listResumes,
  listDeleted: listDeletedResumes,
  count: countResumes,
  countDeleted: countDeletedResumes,
  deleteOne: deleteResume,
  deleteMany: deleteResumes,
  restoreOne: restoreResume,
  restoreMany: restoreResumes,
  permanentlyDeleteOne: permanentlyDeleteResume,
  permanentlyDeleteMany: permanentlyDeleteResumes,
  rename: renameResume,
  duplicate: duplicateResume,
};

export default function MyResumesPageContent() {
  const { notifyResumeListChanged } = useAppState();

  return (
    <SavedDocumentsPageContent<ResumeRow, ResumeSort>
      labels={labels}
      api={api}
      pageSize={RESUMES_PAGE_SIZE}
      freeTierLimit={FREE_TIER_LIMITS.resumes}
      newDocumentHref="/app"
      getEditHref={(row) => `/app?resumeId=${row.id}&template=${row.templateId}`}
      notifyListChanged={notifyResumeListChanged}
    />
  );
}
