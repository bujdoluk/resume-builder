"use client";

import { useAppState } from "@/components/AppState";
import SavedDocumentsPageContent, {
  type SavedDocumentsApi,
  type SavedDocumentsLabels,
} from "@/components/SavedDocumentsPageContent";
import { COVER_LETTERS_PAGE_SIZE, FREE_TIER_LIMITS } from "@/lib/constants";
import {
  countCoverLetters,
  countDeletedCoverLetters,
  deleteCoverLetter,
  deleteCoverLetters,
  duplicateCoverLetter,
  listCoverLetters,
  listDeletedCoverLetters,
  permanentlyDeleteCoverLetter,
  permanentlyDeleteCoverLetters,
  renameCoverLetter,
  restoreCoverLetter,
  restoreCoverLetters,
} from "@/lib/supabase/coverLetters";
import type { CoverLetterRow, CoverLetterSort } from "@/types/coverLetter";

const labels: SavedDocumentsLabels = {
  pageTitle: "myCoverLetters.pageTitle",
  newDocument: "myCoverLetters.newCoverLetter",
  activeTab: "myCoverLetters.activeTab",
  recentlyDeletedTab: "myCoverLetters.recentlyDeletedTab",
  loadFailed: "myCoverLetters.loadFailed",
  empty: "myCoverLetters.empty",
  deletedEmpty: "myCoverLetters.deletedEmpty",
  name: "myCoverLetters.name",
  created: "myCoverLetters.created",
  updated: "myCoverLetters.updated",
  deletedOn: "myCoverLetters.deletedOn",
  untitled: "coverLetter.untitled",
  rename: "myCoverLetters.rename",
  duplicate: "myCoverLetters.duplicate",
  edit: "myCoverLetters.edit",
  delete: "myCoverLetters.delete",
  restore: "myCoverLetters.restore",
  deleteForever: "myCoverLetters.deleteForever",
  selectedCount: "myCoverLetters.selectedCount",
  deleteSelected: "myCoverLetters.deleteSelected",
  restoreSelected: "myCoverLetters.restoreSelected",
  deleteForeverSelected: "myCoverLetters.deleteForeverSelected",
  confirmDelete: "myCoverLetters.confirmDelete",
  confirmDeleteForever: "myCoverLetters.confirmDeleteForever",
  confirmBulkDelete: "myCoverLetters.confirmBulkDelete",
  confirmBulkDeleteForever: "myCoverLetters.confirmBulkDeleteForever",
  restored: "myCoverLetters.restored",
  restoreFailed: "myCoverLetters.restoreFailed",
  deleteForeverFailed: "myCoverLetters.deleteForeverFailed",
  duplicateFailed: "myCoverLetters.duplicateFailed",
  limitReached: "pricing.coverLetterLimitReached",
  dialogTitle: "coverLetter.nameDialogTitle",
  dialogPlaceholder: "coverLetter.namePlaceholder",
  dialogTooLongMessage: "coverLetter.nameTooLong",
};

const api: SavedDocumentsApi<CoverLetterRow, CoverLetterSort> = {
  list: listCoverLetters,
  listDeleted: listDeletedCoverLetters,
  count: countCoverLetters,
  countDeleted: countDeletedCoverLetters,
  deleteOne: deleteCoverLetter,
  deleteMany: deleteCoverLetters,
  restoreOne: restoreCoverLetter,
  restoreMany: restoreCoverLetters,
  permanentlyDeleteOne: permanentlyDeleteCoverLetter,
  permanentlyDeleteMany: permanentlyDeleteCoverLetters,
  rename: renameCoverLetter,
  duplicate: duplicateCoverLetter,
};

export default function MyCoverLettersPageContent() {
  const { notifyCoverLetterListChanged } = useAppState();

  return (
    <SavedDocumentsPageContent<CoverLetterRow, CoverLetterSort>
      labels={labels}
      api={api}
      pageSize={COVER_LETTERS_PAGE_SIZE}
      freeTierLimit={FREE_TIER_LIMITS.coverLetters}
      newDocumentHref="/cover-letter"
      getEditHref={(row) => `/cover-letter?id=${row.id}`}
      notifyListChanged={notifyCoverLetterListChanged}
    />
  );
}
