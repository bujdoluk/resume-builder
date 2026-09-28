import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/AppState";
import CoverLetterBuilder from "@/components/cover-letter/CoverLetterBuilder";
import { ToastProvider } from "@/components/Toast";
import { emptyCoverLetterData } from "@/lib/coverLetterData";
import { formatPhoneAsYouType } from "@/lib/phone";
import { renderWithQueryClient } from "@/__tests__/test-utils/renderWithProviders";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  ensureUserId: vi.fn(),
  getSubscription: vi.fn(),
  countCoverLetters: vi.fn(),
  getCoverLetter: vi.fn(),
  saveCoverLetter: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
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

vi.mock("@/lib/supabase/coverLetters", () => ({
  countCoverLetters: mocks.countCoverLetters,
  getCoverLetter: mocks.getCoverLetter,
  saveCoverLetter: mocks.saveCoverLetter,
}));

// jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

// fireEvent.change instead of userEvent.type: per-keystroke rerenders of both panes are too slow.
function fillField(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

afterEach(cleanup);

beforeEach(() => {
  // jsdom lacks showModal/close, and testing-library checks the open attribute.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };

  vi.clearAllMocks();
  window.localStorage.clear();

  mocks.ensureUserId.mockResolvedValue("test-user-id");
  mocks.getSubscription.mockResolvedValue({
    plan: "free",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  mocks.countCoverLetters.mockResolvedValue(0);
  mocks.saveCoverLetter.mockImplementation(async (_supabase, params) => ({
    id: "cover-letter-1",
    name: params.name,
    data: params.data,
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
  }));
});

describe("CoverLetterBuilder", () => {
  it("fills out every cover letter section and saves the cover letter", async () => {
    // The full builder tree is slow under load; 15s was still flaky.
    const user = userEvent.setup();

    const { container } = renderWithQueryClient(
      <AppStateProvider>
        <ToastProvider>
          <CoverLetterBuilder />
        </ToastProvider>
      </AppStateProvider>,
    );

    // Both panes render in jsdom, so scope queries to the desktop pane.
    const rootEl = container.children[0] as HTMLElement;
    const desktopPaneEl = rootEl.children[1] as HTMLElement;
    const desktopPane = within(desktopPaneEl);

    // "Jane Doe" also matches the signature field, which is an alias of senderName.
    fillField(desktopPane.getAllByPlaceholderText("Jane Doe")[0]!, "Jane Doe");
    fillField(
      desktopPane.getByPlaceholderText("123 Main St, Springfield"),
      "456 Oak Ave, Metropolis",
    );
    fillField(
      desktopPane.getByPlaceholderText("jane@example.com"),
      "jane.doe@example.com",
    );
    const rawSenderPhone = "+1 555 0100";
    const expectedSenderPhone = formatPhoneAsYouType(rawSenderPhone);
    fillField(desktopPane.getByPlaceholderText("+1 555 0100"), rawSenderPhone);

    fillField(desktopPane.getByPlaceholderText("e.g. 01-06-2026"), "01-08-2026");

    fillField(desktopPane.getByPlaceholderText("Hiring Manager"), "Alex Recruiter");
    fillField(desktopPane.getByPlaceholderText("Acme Inc."), "Acme Inc.");
    fillField(desktopPane.getByPlaceholderText("e.g. Illinois"), "Illinois");
    fillField(desktopPane.getByPlaceholderText("e.g. 62704"), "62704");
    const rawRecipientPhone = "+1 555 0200";
    const expectedRecipientPhone = formatPhoneAsYouType(rawRecipientPhone);
    fillField(
      desktopPane.getByPlaceholderText("+1 555 0200"),
      rawRecipientPhone,
    );
    fillField(desktopPane.getByPlaceholderText("hr@acme.com"), "hr@acme.com");

    fillField(
      desktopPane.getByPlaceholderText("Application for Frontend Developer"),
      "Application for Senior Frontend Engineer",
    );

    fillField(desktopPane.getByPlaceholderText("Dear Hiring Manager,"), "Dear Alex,");
    fillField(
      desktopPane.getByPlaceholderText("Explain why you're a great fit for this role..."),
      "I have spent eight years building accessible, performant web applications and would love to bring that experience to your team.",
    );
    fillField(desktopPane.getByPlaceholderText("Sincerely,"), "Best regards,");

    fillField(desktopPane.getByPlaceholderText("e.g. Slovak"), "Willing to relocate");

    await user.click(desktopPane.getByRole("button", { name: "Save" }));

    const dialog = within(await screen.findByRole("dialog"));
    fillField(
      dialog.getByPlaceholderText("e.g. Frontend Developer Cover Letter"),
      "My Test Cover Letter",
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.saveCoverLetter).toHaveBeenCalledTimes(1));
    const [, savedParams] = mocks.saveCoverLetter.mock.calls[0]!;

    expect(savedParams.name).toBe("My Test Cover Letter");
    expect(savedParams.data).toMatchObject({
      senderName: "Jane Doe",
      senderAddress: "456 Oak Ave, Metropolis",
      senderEmail: "jane.doe@example.com",
      senderPhone: expectedSenderPhone,
      date: "01-08-2026",
      recipientName: "Alex Recruiter",
      recipientCompany: "Acme Inc.",
      recipientState: "Illinois",
      recipientZipCode: "62704",
      recipientPhone: expectedRecipientPhone,
      recipientEmail: "hr@acme.com",
      subject: "Application for Senior Frontend Engineer",
      greeting: "Dear Alex,",
      body: "I have spent eight years building accessible, performant web applications and would love to bring that experience to your team.",
      closing: "Best regards,",
      customFieldValue: "Willing to relocate",
    });

    expect(mocks.replace).toHaveBeenCalledWith(
      expect.stringContaining("id=cover-letter-1"),
    );
    await waitFor(() =>
      expect(desktopPane.getByRole("button", { name: "Saved" })).toBeInTheDocument(),
    );
  }, 30000);

  it("loads an existing cover letter by id", async () => {
    mocks.getCoverLetter.mockResolvedValue({
      id: "cover-letter-1",
      name: "Existing Cover Letter",
      data: { ...emptyCoverLetterData, recipientCompany: "Acme Inc." },
      shareToken: null,
      shareTokenExpiresAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      deletedAt: null,
    });

    renderWithQueryClient(
      <AppStateProvider>
        <ToastProvider>
          <CoverLetterBuilder initialCoverLetterId="cover-letter-1" />
        </ToastProvider>
      </AppStateProvider>,
    );

    // [0] is the mobile input, [1] the desktop one.
    const companyInputs = await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("Acme Inc.") as HTMLInputElement[];
      expect(inputs).toHaveLength(2);
      return inputs;
    });
    await waitFor(() => expect(companyInputs[1]).toHaveValue("Acme Inc."));
  });
});
