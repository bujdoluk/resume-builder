import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";
import { emptyResumeData } from "@/lib/resumeData";
import { ResumeImportExtractionError } from "@/lib/resumeImport/extractText";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyCaptchaToken: vi.fn(),
  extractResumeText: vi.fn(),
  parseResumeText: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/hcaptcha", () => ({
  verifyCaptchaToken: mocks.verifyCaptchaToken,
}));

vi.mock("@/lib/resumeImport/extractText", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/resumeImport/extractText")>();
  return { ...actual, extractResumeText: mocks.extractResumeText };
});

vi.mock("@/lib/resumeImport/parseResumeText", () => ({
  parseResumeText: mocks.parseResumeText,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/import-resume", {
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
  mocks.extractResumeText.mockResolvedValue("Jane Doe resume text");
  mocks.parseResumeText.mockResolvedValue({ ...emptyResumeData, name: "Jane Doe" });
});

describe("POST /api/import-resume", () => {
  it("returns 429 and never checks the captcha when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.verifyCaptchaToken).not.toHaveBeenCalled();
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha verification", async () => {
    mocks.verifyCaptchaToken.mockResolvedValue(false);

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.captchaVerificationFailed);
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("rejects a missing file", async () => {
    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest({ ...validBody, fileBase64: undefined }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.missingImportFile);
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file type", async () => {
    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest({ ...validBody, fileType: "txt" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidImportFileType);
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const { POST } = await import("@/app/api/import-resume/route");
    const request = new Request("https://example.com/api/import-resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.missingImportFile);
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("rejects a file over the max size", async () => {
    const oversized = Buffer.alloc(MAX_IMPORT_FILE_BYTES + 1).toString("base64");

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest({ ...validBody, fileBase64: oversized }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.importFileTooLarge);
    expect(mocks.extractResumeText).not.toHaveBeenCalled();
  });

  it("returns 502 without extracting text when GROQ_API_KEY isn't configured", async () => {
    delete process.env.GROQ_API_KEY;

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.importUnavailable);
    expect(mocks.extractResumeText).not.toHaveBeenCalled();
  });

  it("returns 400 when text extraction fails on a corrupt file", async () => {
    mocks.extractResumeText.mockRejectedValue(new ResumeImportExtractionError("corrupt"));

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.importParsingFailed);
    expect(mocks.parseResumeText).not.toHaveBeenCalled();
  });

  it("returns the parsed resume data on success", async () => {
    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(mocks.extractResumeText).toHaveBeenCalledWith(expect.any(Buffer), "pdf");
    expect(mocks.parseResumeText).toHaveBeenCalledWith("Jane Doe resume text");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { ...emptyResumeData, name: "Jane Doe" } });
  });

  it("returns 502 and reports to Sentry when Groq parsing fails", async () => {
    mocks.parseResumeText.mockRejectedValue(new Error("groq down"));

    const { POST } = await import("@/app/api/import-resume/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.resumeImportFailed);
    expect(mocks.captureException).toHaveBeenCalled();
  });
});
