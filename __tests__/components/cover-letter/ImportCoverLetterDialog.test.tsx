import "@testing-library/jest-dom/vitest";
import "@/lib/i18n/i18n";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImportCoverLetterDialog, {
  type ImportCoverLetterDialogHandle,
} from "@/components/cover-letter/ImportCoverLetterDialog";
import { ToastProvider } from "@/components/Toast";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/constants";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";

vi.mock("@/lib/supabase/invisibleCaptcha", () => ({
  getAnonymousCaptchaToken: vi.fn().mockResolvedValue("captcha-token"),
}));

function Harness({ onResult }: { onResult: (data: CoverLetterData | null) => void }) {
  const ref = useRef<ImportCoverLetterDialogHandle>(null);
  return (
    <ToastProvider>
      <button onClick={async () => onResult(await ref.current!.open())}>open</button>
      <ImportCoverLetterDialog ref={ref} />
    </ToastProvider>
  );
}

const importedData: CoverLetterData = {
  ...emptyCoverLetterData,
  senderName: "Jane Doe",
  senderEmail: "jane@example.com",
  recipientCompany: "Acme Inc.",
};

afterEach(cleanup);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };

  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: importedData }),
    }),
  );
});

describe("ImportCoverLetterDialog", () => {
  it("uploads a chosen file, shows a review summary, and resolves with the parsed data on apply", async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);

    fireEvent.click(screen.getByText("open"));

    const file = new File(["%PDF-1.4 fake"], "cover-letter.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText("Import"));

    await waitFor(() => expect(screen.getByText("Use This Data")).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/import-cover-letter",
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(screen.getByText("Use This Data"));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(importedData));
  });

  it("resolves with null on cancel without calling the API", async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);

    fireEvent.click(screen.getByText("open"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(null));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit before ever calling the API", async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);

    fireEvent.click(screen.getByText("open"));

    const oversized = new File([new Uint8Array(MAX_IMPORT_FILE_BYTES + 1)], "cover-letter.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [oversized] } });

    expect(screen.getByText("Import")).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
