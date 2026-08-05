import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/AppState";
import ResumeBuilder from "@/components/resumes/ResumeBuilder";
import { ToastProvider } from "@/components/Toast";
import { formatPhoneAsYouType } from "@/lib/phone";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  ensureUserId: vi.fn(),
  getSubscription: vi.fn(),
  countResumes: vi.fn(),
  getResume: vi.fn(),
  saveResume: vi.fn(),
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

vi.mock("@/lib/supabase/resumes", () => ({
  countResumes: mocks.countResumes,
  getResume: mocks.getResume,
  saveResume: mocks.saveResume,
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
// userEvent.type's per-keystroke renders — ResumeBuilder re-renders both the
// mobile and desktop panes on every change, which is far too expensive per
// character across ~30 fields in jsdom.
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
  mocks.countResumes.mockResolvedValue(0);
  mocks.saveResume.mockImplementation(async (_supabase, params) => ({
    id: "resume-1",
    name: params.name,
    templateId: params.templateId,
    color: params.color,
    font: params.font,
    fontSize: params.fontSize,
    sectionOrder: params.sectionOrder,
    visibleFields: params.visibleFields,
    modernSectionZones: params.modernSectionZones,
    data: params.data,
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
  }));
});

describe("ResumeBuilder", () => {
  it("fills out every resume section and saves the resume", async () => {
    const user = userEvent.setup();

    // Renders the full builder tree (both mobile and desktop panes) and
    // touches ~30 fields; the default 5000ms testTimeout is too tight once
    // this runs alongside the rest of the suite under load. Even 15000ms
    // has proven flaky as the suite has grown — 30000ms gives real headroom.

    const { container } = render(
      <AppStateProvider>
        <ToastProvider>
          <ResumeBuilder />
        </ToastProvider>
      </AppStateProvider>,
    );

    // ResumeBuilder renders a mobile pane and a desktop pane at the same
    // time (Tailwind's responsive classes aren't applied in jsdom), so every
    // field/button exists twice. Scope everything to the desktop pane, which
    // always renders the same Resume.tsx regardless of template.
    const desktopPaneEl = container.children[1] as HTMLElement;
    const desktopPane = within(desktopPaneEl);

    // Personal information
    fillField(desktopPane.getByPlaceholderText("Your name"), "Jane Doe");
    fillField(
      desktopPane.getByPlaceholderText("Your job title"),
      "Senior Frontend Engineer",
    );
    const rawPhone = "+1 555 0100";
    const expectedPhone = formatPhoneAsYouType(rawPhone);
    fillField(desktopPane.getByPlaceholderText("Your phone"), rawPhone);
    fillField(desktopPane.getByPlaceholderText("Your email"), "jane.doe@example.com");
    fillField(
      desktopPane.getByPlaceholderText("Your address"),
      "123 Main St, Springfield",
    );
    fillField(desktopPane.getByPlaceholderText("Your website"), "https://janedoe.dev");
    fillField(
      desktopPane.getByPlaceholderText("Your LinkedIn"),
      "linkedin.com/in/janedoe",
    );

    const photoInput = desktopPaneEl.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (!photoInput) throw new Error("Photo upload input not found");
    const photoFile = new File(["fake-image-bytes"], "photo.png", {
      type: "image/png",
    });
    await user.upload(photoInput, photoFile);
    await waitFor(() =>
      expect(desktopPaneEl.querySelector('img[alt="Profile photo"]')).toBeInTheDocument(),
    );

    // About Me
    fillField(
      desktopPane.getByPlaceholderText("Write a short summary about yourself..."),
      "Frontend engineer with 8 years of experience building accessible web applications.",
    );

    // Work Experience (filled before Education so its "Location" field is
    // still the only one in the pane)
    await user.click(
      desktopPane.getByRole("button", { name: "+ Add Work Experience" }),
    );
    fillField(
      desktopPane.getByPlaceholderText("Your position"),
      "Senior Frontend Engineer",
    );
    fillField(
      desktopPane.getByPlaceholderText("Start date (e.g. 01-06-2020)"),
      "06-2020",
    );
    fillField(desktopPane.getByPlaceholderText("End date or Present"), "Present");
    fillField(desktopPane.getByPlaceholderText("Location"), "Remote");
    fillField(
      desktopPane.getByPlaceholderText("Describe your responsibilities and achievements..."),
      "Led the migration to a component-driven design system, improving delivery speed by 30%.",
    );

    // Education
    await user.click(desktopPane.getByRole("button", { name: "+ Add Education" }));
    fillField(desktopPane.getByPlaceholderText("School name"), "State University");
    fillField(desktopPane.getByPlaceholderText("Subject of study"), "Computer Science");
    fillField(
      desktopPane.getByPlaceholderText("Start date (e.g. 01-09-2016)"),
      "09-2016",
    );
    fillField(desktopPane.getByPlaceholderText("End date"), "06-2020");
    const locationInputs = desktopPane.getAllByPlaceholderText("Location");
    fillField(locationInputs[1], "Springfield");
    fillField(
      desktopPane.getByPlaceholderText("Describe your studies, thesis, honours..."),
      "Graduated with honours; thesis on distributed systems.",
    );

    // Skills
    await user.click(desktopPane.getByRole("button", { name: "+ Add Skill" }));
    fillField(desktopPane.getByPlaceholderText("Your skill"), "TypeScript");

    // Languages
    await user.click(desktopPane.getByRole("button", { name: "+ Add Language" }));
    fillField(desktopPane.getByPlaceholderText("Your language"), "English");
    await user.click(desktopPane.getByRole("radio", { name: "Advanced" }));

    // Interests
    await user.click(desktopPane.getByRole("button", { name: "+ Add Interest" }));
    fillField(desktopPane.getByPlaceholderText("Your interest"), "Rock climbing");

    // Save
    await user.click(desktopPane.getByRole("button", { name: "Save" }));

    const dialog = within(await screen.findByRole("dialog"));
    fillField(
      dialog.getByPlaceholderText("e.g. Frontend Developer Resume"),
      "My Test Resume",
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mocks.saveResume).toHaveBeenCalledTimes(1));
    const [, savedParams] = mocks.saveResume.mock.calls[0];

    expect(savedParams.name).toBe("My Test Resume");
    expect(savedParams.data).toMatchObject({
      photo: expect.stringMatching(/^data:image\/png/),
      name: "Jane Doe",
      jobTitle: "Senior Frontend Engineer",
      phone: expectedPhone,
      email: "jane.doe@example.com",
      address: "123 Main St, Springfield",
      website: "https://janedoe.dev",
      linkedin: "linkedin.com/in/janedoe",
      aboutMe:
        "Frontend engineer with 8 years of experience building accessible web applications.",
    });
    expect(savedParams.data.workExperience).toMatchObject([
      {
        position: "Senior Frontend Engineer",
        dateFrom: "06-2020",
        dateTo: "Present",
        location: "Remote",
        jobDescription:
          "Led the migration to a component-driven design system, improving delivery speed by 30%.",
      },
    ]);
    expect(savedParams.data.education).toMatchObject([
      {
        school: "State University",
        subject: "Computer Science",
        dateFrom: "09-2016",
        dateTo: "06-2020",
        location: "Springfield",
        description: "Graduated with honours; thesis on distributed systems.",
      },
    ]);
    expect(savedParams.data.skills).toMatchObject([{ value: "TypeScript" }]);
    expect(savedParams.data.languages).toMatchObject([
      { language: "English", level: "Advanced" },
    ]);
    expect(savedParams.data.interests).toMatchObject([{ value: "Rock climbing" }]);

    expect(mocks.replace).toHaveBeenCalledWith(
      expect.stringContaining("resumeId=resume-1"),
    );
    await waitFor(() =>
      expect(desktopPane.getByRole("button", { name: "Saved" })).toBeInTheDocument(),
    );
  }, 30000);
});
