import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ATTACHMENT_BYTES, MAX_TEXT_LENGTH } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyCaptchaToken: vi.fn(),
  sendPdfEmail: vi.fn(),
  sendDocxEmail: vi.fn(),
  sendTextEmail: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/hcaptcha", () => ({
  verifyCaptchaToken: mocks.verifyCaptchaToken,
}));

vi.mock("@/lib/email/sendPdfEmail", () => ({ sendPdfEmail: mocks.sendPdfEmail }));
vi.mock("@/lib/email/sendDocxEmail", () => ({ sendDocxEmail: mocks.sendDocxEmail }));
vi.mock("@/lib/email/sendTextEmail", () => ({ sendTextEmail: mocks.sendTextEmail }));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/send-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  to: "jane@example.com",
  fileName: "My Resume",
  captchaToken: "captcha-token",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.verifyCaptchaToken.mockResolvedValue(true);
  mocks.sendPdfEmail.mockResolvedValue({ error: null });
  mocks.sendDocxEmail.mockResolvedValue({ error: null });
  mocks.sendTextEmail.mockResolvedValue({ error: null });
});

describe("POST /api/send-email", () => {
  it("returns 429 and never verifies the captcha when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/send-email/route");
    const response = await POST(jsonRequest({ ...validBody, format: "pdf", pdfBase64: "abc" }));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.verifyCaptchaToken).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha verification", async () => {
    mocks.verifyCaptchaToken.mockResolvedValue(false);

    const { POST } = await import("@/app/api/send-email/route");
    const response = await POST(jsonRequest({ ...validBody, format: "pdf", pdfBase64: "abc" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.captchaVerificationFailed);
    expect(mocks.sendPdfEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed recipient address", async () => {
    const { POST } = await import("@/app/api/send-email/route");
    const response = await POST(
      jsonRequest({ ...validBody, to: "not-an-email", format: "pdf", pdfBase64: "abc" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidEmailAddress);
  });

  it("sanitizes a fileName containing path separators", async () => {
    const { POST } = await import("@/app/api/send-email/route");
    await POST(
      jsonRequest({
        ...validBody,
        fileName: "../../etc/passwd",
        format: "pdf",
        pdfBase64: Buffer.from("pdf-bytes").toString("base64"),
      }),
    );

    expect(mocks.sendPdfEmail).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "..-..-etc-passwd" }),
    );
  });

  it("falls back to a default fileName when none is given", async () => {
    const { POST } = await import("@/app/api/send-email/route");
    await POST(
      jsonRequest({
        to: validBody.to,
        captchaToken: validBody.captchaToken,
        format: "pdf",
        pdfBase64: Buffer.from("pdf-bytes").toString("base64"),
      }),
    );

    expect(mocks.sendPdfEmail).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "document" }),
    );
  });

  describe("format: txt", () => {
    it("rejects missing text content", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(jsonRequest({ ...validBody, format: "txt" }));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.invalidTextData);
    });

    it("rejects text content over the max length", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({
          ...validBody,
          format: "txt",
          textContent: "a".repeat(MAX_TEXT_LENGTH + 1),
        }),
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.invalidTextData);
    });

    it("sends the text email and returns ok on success", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({ ...validBody, format: "txt", textContent: "Hello, world!" }),
      );

      expect(mocks.sendTextEmail).toHaveBeenCalledWith({
        to: "jane@example.com",
        fileName: "My Resume",
        textContent: "Hello, world!",
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    });

    it("propagates a provider error as 502 with the raw error message", async () => {
      mocks.sendTextEmail.mockResolvedValue({ error: "Resend rejected the request" });

      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({ ...validBody, format: "txt", textContent: "Hello, world!" }),
      );

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "Resend rejected the request" });
    });
  });

  describe("format: docx", () => {
    it("rejects a missing attachment", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(jsonRequest({ ...validBody, format: "docx" }));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.missingWordData);
    });

    it("rejects an oversized attachment", async () => {
      const oversized = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1).toString("base64");

      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({ ...validBody, format: "docx", docxBase64: oversized }),
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.invalidWordData);
      expect(mocks.sendDocxEmail).not.toHaveBeenCalled();
    });

    it("sends the docx email with the decoded buffer", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({
          ...validBody,
          format: "docx",
          docxBase64: Buffer.from("docx-bytes").toString("base64"),
        }),
      );

      expect(mocks.sendDocxEmail).toHaveBeenCalledWith({
        to: "jane@example.com",
        fileName: "My Resume",
        docxBuffer: Buffer.from("docx-bytes"),
      });
      expect(response.status).toBe(200);
    });
  });

  describe("format: pdf (default)", () => {
    it("rejects a missing attachment", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(jsonRequest({ ...validBody }));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.missingPdfData);
    });

    it("rejects an oversized attachment", async () => {
      const oversized = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1).toString("base64");

      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(jsonRequest({ ...validBody, pdfBase64: oversized }));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(en.apiErrors.invalidPdfData);
      expect(mocks.sendPdfEmail).not.toHaveBeenCalled();
    });

    it("sends the pdf email with the decoded buffer", async () => {
      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({ ...validBody, pdfBase64: Buffer.from("pdf-bytes").toString("base64") }),
      );

      expect(mocks.sendPdfEmail).toHaveBeenCalledWith({
        to: "jane@example.com",
        fileName: "My Resume",
        pdfBuffer: Buffer.from("pdf-bytes"),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    });

    it("propagates a provider error as 502 with the raw error message", async () => {
      mocks.sendPdfEmail.mockResolvedValue({ error: "Resend rejected the request" });

      const { POST } = await import("@/app/api/send-email/route");
      const response = await POST(
        jsonRequest({ ...validBody, pdfBase64: Buffer.from("pdf-bytes").toString("base64") }),
      );

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "Resend rejected the request" });
    });
  });
});
