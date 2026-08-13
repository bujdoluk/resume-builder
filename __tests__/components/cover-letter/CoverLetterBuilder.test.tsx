import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/AppState";
import CoverLetterBuilder from "@/components/cover-letter/CoverLetterBuilder";
import { ToastProvider } from "@/components/Toast";
import { formatPhoneAsYouType } from "@/lib/phone";

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

// jsdom doesn't implement ResizeObserver; ScaleToFit only uses it to react
// to layout changes we don't need in a headless test.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

// Fills a text input/textarea in one render (fireEvent.change) instead of
// userEvent.type's per-keystroke renders — CoverLetterBuilder re-renders both
// the mobile and desktop panes on every change, which is far too expensive
// per character across every field in jsdom.
function fillField(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

beforeEach(() => {
  // jsdom doesn't implement <dialog>'s showModal/close; the save-name dialog
  // and testing-library's visibility checks both rely on the `open` attribute.
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
    // Renders the full builder tree (both mobile and desktop panes); the
    // default 5000ms testTimeout is too tight once this runs alongside the
    // rest of the suite under load. Even 15000ms has proven flaky as the
    // suite has grown — 30000ms gives real headroom.
    const user = userEvent.setup();

    const { container } = render(
      <AppStateProvider>
        <ToastProvider>
          <CoverLetterBuilder />
        </ToastProvider>
      </AppStateProvider>,
    );

    // CoverLetterBuilder returns a single wrapping <div> (unlike
    // ResumeBuilder's Fragment), containing the mobile pane and desktop pane
    // as its own children. Both panes render simultaneously in jsdom since
    // Tailwind's responsive classes aren't applied, so scope everything to
    // the desktop pane to avoid ambiguous matches.
    const rootEl = container.children[0] as HTMLElement;
    const desktopPaneEl = rootEl.children[1] as HTMLElement;
    const desktopPane = within(desktopPaneEl);

    // Your Information — "Jane Doe" placeholder also appears on the Letter
    // section's "signature" field, which is a deliberate UI alias for the
    // same senderName data (not a separate field), so only the first match
    // needs to be filled.
    fillField(desktopPane.getAllByPlaceholderText("Jane Doe")[0], "Jane Doe");
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
    const [, savedParams] = mocks.saveCoverLetter.mock.calls[0];

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
});
