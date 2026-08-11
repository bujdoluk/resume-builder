import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";
import { emptyCoverLetterData } from "@/lib/coverLetterData";
import { DocumentImportExtractionError } from "@/lib/documentImport/extractText";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyCaptchaToken: vi.fn(),
  extractDocumentText: vi.fn(),
  parseCoverLetterText: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/hcaptcha", () => ({
  verifyCaptchaToken: mocks.verifyCaptchaToken,
}));

vi.mock("@/lib/documentImport/extractText", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/documentImport/extractText")>();
  return { ...actual, extractDocumentText: mocks.extractDocumentText };
});

vi.mock("@/lib/coverLetterImport/parseCoverLetterText", () => ({
  parseCoverLetterText: mocks.parseCoverLetterText,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/import-cover-letter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  captchaToken: "captcha-token",
  fileBase64: Buffer.from("fake pdf bytes").toString("base64"),
  fileType: "pdf",
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GROQ_API_KEY = "test-groq-key";
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.verifyCaptchaToken.mockResolvedValue(true);
  mocks.extractDocumentText.mockResolvedValue("Jane Doe cover letter text");
  mocks.parseCoverLetterText.mockResolvedValue({ ...emptyCoverLetterData, senderName: "Jane Doe" });
});

describe("POST /api/import-cover-letter", () => {
  it("returns 429 and never checks the captcha when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.verifyCaptchaToken).not.toHaveBeenCalled();
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha verification", async () => {
    mocks.verifyCaptchaToken.mockResolvedValue(false);

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.captchaVerificationFailed);
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("rejects a missing file", async () => {
    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest({ ...validBody, fileBase64: undefined }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.missingImportCoverLetterFile);
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file type", async () => {
    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest({ ...validBody, fileType: "txt" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidImportCoverLetterFileType);
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const { POST } = await import("@/app/api/import-cover-letter/route");
    const request = new Request("https://example.com/api/import-cover-letter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.missingImportCoverLetterFile);
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("rejects a file over the max size", async () => {
    const oversized = Buffer.alloc(MAX_IMPORT_FILE_BYTES + 1).toString("base64");

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest({ ...validBody, fileBase64: oversized }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.importCoverLetterFileTooLarge);
    expect(mocks.extractDocumentText).not.toHaveBeenCalled();
  });

  it("returns 502 without extracting text when GROQ_API_KEY isn't configured", async () => {
    delete process.env.GROQ_API_KEY;

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.importCoverLetterUnavailable);
    expect(mocks.extractDocumentText).not.toHaveBeenCalled();
  });

  it("returns 400 when text extraction fails on a corrupt file", async () => {
    mocks.extractDocumentText.mockRejectedValue(new DocumentImportExtractionError("corrupt"));

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.importCoverLetterParsingFailed);
    expect(mocks.parseCoverLetterText).not.toHaveBeenCalled();
  });

  it("returns the parsed cover letter data on success", async () => {
    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(mocks.extractDocumentText).toHaveBeenCalledWith(expect.any(Buffer), "pdf");
    expect(mocks.parseCoverLetterText).toHaveBeenCalledWith("Jane Doe cover letter text");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { ...emptyCoverLetterData, senderName: "Jane Doe" } });
  });

  it("returns 502 and reports to Sentry when Groq parsing fails", async () => {
    mocks.parseCoverLetterText.mockRejectedValue(new Error("groq down"));

    const { POST } = await import("@/app/api/import-cover-letter/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.coverLetterImportFailed);
    expect(mocks.captureException).toHaveBeenCalled();
  });
});
