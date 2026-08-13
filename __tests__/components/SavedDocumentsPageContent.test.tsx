import "@testing-library/jest-dom/vitest";
import "@/lib/i18n/i18n";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SavedDocumentsPageContent, {
  type SavedDocumentRow,
  type SavedDocumentsApi,
  type SavedDocumentsLabels,
} from "@/components/SavedDocumentsPageContent";
import { ToastProvider } from "@/components/Toast";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  captureException: vi.fn(),
  ensureUserId: vi.fn(),
  getSubscription: vi.fn(),
  list: vi.fn(),
  listDeleted: vi.fn(),
  count: vi.fn(),
  countDeleted: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
  restoreOne: vi.fn(),
  restoreMany: vi.fn(),
  permanentlyDeleteOne: vi.fn(),
  permanentlyDeleteMany: vi.fn(),
  rename: vi.fn(),
  duplicate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

vi.mock("@/lib/supabase/session", () => ({
  ensureUserId: mocks.ensureUserId,
}));

vi.mock("@/lib/supabase/subscriptions", () => ({
  getSubscription: mocks.getSubscription,
  isPaidPlan: (plan: string) => plan !== "free",
}));

// Reuses the real "myResumes.*"/"pricing.*" translation keys — this test
// exercises the shared mechanics behind both MyResumesPageContent and
// MyCoverLettersPageContent, not resume-specific wording, so which real
// keys the fake `labels` point at doesn't matter.
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

const api: SavedDocumentsApi<SavedDocumentRow, { column: "name" | "created_at" | "updated_at" | "deleted_at"; ascending: boolean }> = {
  list: mocks.list,
  listDeleted: mocks.listDeleted,
  count: mocks.count,
  countDeleted: mocks.countDeleted,
  deleteOne: mocks.deleteOne,
  deleteMany: mocks.deleteMany,
  restoreOne: mocks.restoreOne,
  restoreMany: mocks.restoreMany,
  permanentlyDeleteOne: mocks.permanentlyDeleteOne,
  permanentlyDeleteMany: mocks.permanentlyDeleteMany,
  rename: mocks.rename,
  duplicate: mocks.duplicate,
};

const rows: SavedDocumentRow[] = [
  { id: "doc-1", name: "First Document", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z", deletedAt: null },
  { id: "doc-2", name: "Second Document", createdAt: "2026-01-03T00:00:00Z", updatedAt: "2026-01-04T00:00:00Z", deletedAt: null },
];

function renderPage() {
  return render(
    <ToastProvider>
      <SavedDocumentsPageContent
        labels={labels}
        api={api}
        pageSize={12}
        freeTierLimit={2}
        newDocumentHref="/app"
        getEditHref={(row) => `/app?id=${row.id}`}
        notifyListChanged={vi.fn()}
      />
    </ToastProvider>,
  );
}

afterEach(cleanup);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };

  vi.clearAllMocks();
  mocks.ensureUserId.mockResolvedValue("user-1");
  mocks.getSubscription.mockResolvedValue({ plan: "pro" });
  mocks.list.mockResolvedValue(rows);
  mocks.count.mockResolvedValue(rows.length);
  mocks.listDeleted.mockResolvedValue([]);
  mocks.countDeleted.mockResolvedValue(0);
});

describe("SavedDocumentsPageContent", () => {
  it("loads and renders the active documents, and switches to the deleted tab", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("First Document")).toBeInTheDocument());
    expect(screen.getByText("Second Document")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Recently Deleted"));

    await waitFor(() => expect(mocks.listDeleted).toHaveBeenCalled());
    expect(screen.queryByText("First Document")).not.toBeInTheDocument();
  });

  it("deletes a single document after confirming", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("First Document")).toBeInTheDocument());

    const row = screen.getByText("First Document").closest("tr")!;
    fireEvent.click(within(row).getByText("Delete"));

    const dialog = document.querySelector("dialog[open]") as HTMLElement;
    fireEvent.click(within(dialog).getByText("Delete"));

    await waitFor(() => expect(mocks.deleteOne).toHaveBeenCalledWith({}, "doc-1"));
  });

  it("gates restore behind the free-tier limit and offers to view plans instead of restoring", async () => {
    mocks.getSubscription.mockResolvedValue({ plan: "free" });
    mocks.count.mockResolvedValue(2); // already at the freeTierLimit of 2
    mocks.listDeleted.mockResolvedValue(rows);
    mocks.countDeleted.mockResolvedValue(rows.length);

    renderPage();
    fireEvent.click(screen.getByText("Recently Deleted"));
    await waitFor(() => expect(screen.getByText("First Document")).toBeInTheDocument());

    const row = screen.getByText("First Document").closest("tr")!;
    fireEvent.click(within(row).getByText("Restore"));

    const dialog = await waitFor(() => {
      const el = document.querySelector("dialog[open]");
      if (!el) throw new Error("dialog not open yet");
      return el as HTMLElement;
    });
    fireEvent.click(within(dialog).getByText("View plans"));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/#pricing"));
    expect(mocks.restoreOne).not.toHaveBeenCalled();
  });

  it("renames a document through the rename dialog", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("First Document")).toBeInTheDocument());

    const row = screen.getByText("First Document").closest("tr")!;
    fireEvent.click(within(row).getByText("Rename"));

    const dialog = await waitFor(() => {
      const el = document.querySelector("dialog[open]");
      if (!el) throw new Error("dialog not open yet");
      return el as HTMLElement;
    });
    const input = within(dialog).getByPlaceholderText("e.g. Frontend Developer Resume");
    fireEvent.change(input, { target: { value: "Renamed Document" } });
    fireEvent.click(within(dialog).getByText("Save"));

    await waitFor(() =>
      expect(mocks.rename).toHaveBeenCalledWith({}, "doc-1", "Renamed Document"),
    );
  });
});
