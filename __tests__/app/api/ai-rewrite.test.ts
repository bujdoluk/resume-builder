import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_AI_REWRITE_TEXT_LENGTH } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyCaptchaToken: vi.fn(),
  rewriteText: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/hcaptcha", () => ({
  verifyCaptchaToken: mocks.verifyCaptchaToken,
}));

vi.mock("@/lib/aiRewrite/rewriteText", () => ({
  rewriteText: mocks.rewriteText,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/ai-rewrite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { captchaToken: "captcha-token", text: "Built things and fixed bugs.", style: "bullets" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GROQ_API_KEY = "test-groq-key";
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.verifyCaptchaToken.mockResolvedValue(true);
  mocks.rewriteText.mockResolvedValue("Built and shipped several features, fixing bugs along the way.");
});

describe("POST /api/ai-rewrite", () => {
  it("returns 429 and never checks the captcha when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.verifyCaptchaToken).not.toHaveBeenCalled();
    expect(mocks.rewriteText).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha verification", async () => {
    mocks.verifyCaptchaToken.mockResolvedValue(false);

    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.captchaVerificationFailed);
    expect(mocks.rewriteText).not.toHaveBeenCalled();
  });

  it("rejects missing or blank text", async () => {
    const { POST } = await import("@/app/api/ai-rewrite/route");

    const missing = await POST(jsonRequest({ ...validBody, text: undefined }));
    expect(missing.status).toBe(400);
    expect((await missing.json()).error).toBe(en.apiErrors.invalidTextData);

    const blank = await POST(jsonRequest({ ...validBody, text: "   " }));
    expect(blank.status).toBe(400);
    expect((await blank.json()).error).toBe(en.apiErrors.invalidTextData);
  });

  it("rejects text over the max length", async () => {
    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(
      jsonRequest({ ...validBody, text: "a".repeat(MAX_AI_REWRITE_TEXT_LENGTH + 1) }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidTextData);
    expect(mocks.rewriteText).not.toHaveBeenCalled();
  });

  it("rejects a style that isn't 'bullets' or 'paragraph'", async () => {
    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest({ ...validBody, style: "haiku" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidInput);
    expect(mocks.rewriteText).not.toHaveBeenCalled();
  });

  it("returns 502 without calling Groq when GROQ_API_KEY isn't configured", async () => {
    delete process.env.GROQ_API_KEY;

    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.aiRewriteUnavailable);
    expect(mocks.rewriteText).not.toHaveBeenCalled();
  });

  it("returns the rewritten text on success", async () => {
    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest(validBody));

    expect(mocks.rewriteText).toHaveBeenCalledWith(validBody.text, "bullets");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      rewritten: "Built and shipped several features, fixing bugs along the way.",
    });
  });

  it("returns 502 and reports to Sentry when the rewrite call fails", async () => {
    mocks.rewriteText.mockRejectedValue(new Error("groq down"));

    const { POST } = await import("@/app/api/ai-rewrite/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.aiRewriteFailed);
    expect(mocks.captureException).toHaveBeenCalled();
  });
});
