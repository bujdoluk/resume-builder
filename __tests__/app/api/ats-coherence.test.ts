import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_COHERENCE_CHECK_TEXT_LENGTH } from "@/lib/constants";
import en from "@/lib/i18n/locales/en.json";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyCaptchaToken: vi.fn(),
  checkCoherence: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/hcaptcha", () => ({
  verifyCaptchaToken: mocks.verifyCaptchaToken,
}));

vi.mock("@/lib/atsChecker/checkCoherence", () => ({
  checkCoherence: mocks.checkCoherence,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.com/api/ats-coherence", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { captchaToken: "captcha-token", documentText: "Senior Frontend Engineer with 8 years of experience." };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GROQ_API_KEY = "test-groq-key";
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.verifyCaptchaToken.mockResolvedValue(true);
  mocks.checkCoherence.mockResolvedValue({ coherent: true, reason: "Reads as real professional content." });
});

describe("POST /api/ats-coherence", () => {
  it("returns 429 and never checks the captcha when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe(en.apiErrors.rateLimited);
    expect(mocks.verifyCaptchaToken).not.toHaveBeenCalled();
    expect(mocks.checkCoherence).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha verification", async () => {
    mocks.verifyCaptchaToken.mockResolvedValue(false);

    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.captchaVerificationFailed);
    expect(mocks.checkCoherence).not.toHaveBeenCalled();
  });

  it("rejects missing or blank document text", async () => {
    const { POST } = await import("@/app/api/ats-coherence/route");

    const missing = await POST(jsonRequest({ ...validBody, documentText: undefined }));
    expect(missing.status).toBe(400);
    expect((await missing.json()).error).toBe(en.apiErrors.invalidTextData);

    const blank = await POST(jsonRequest({ ...validBody, documentText: "   " }));
    expect(blank.status).toBe(400);
    expect((await blank.json()).error).toBe(en.apiErrors.invalidTextData);
  });

  it("rejects document text over the max length", async () => {
    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(
      jsonRequest({ ...validBody, documentText: "a".repeat(MAX_COHERENCE_CHECK_TEXT_LENGTH + 1) }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidTextData);
    expect(mocks.checkCoherence).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const { POST } = await import("@/app/api/ats-coherence/route");
    const request = new Request("https://example.com/api/ats-coherence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(en.apiErrors.invalidTextData);
    expect(mocks.checkCoherence).not.toHaveBeenCalled();
  });

  it("returns 502 without calling Groq when GROQ_API_KEY isn't configured", async () => {
    delete process.env.GROQ_API_KEY;

    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.coherenceCheckUnavailable);
    expect(mocks.checkCoherence).not.toHaveBeenCalled();
  });

  it("returns the coherence result on success", async () => {
    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(jsonRequest(validBody));

    expect(mocks.checkCoherence).toHaveBeenCalledWith(validBody.documentText);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      coherent: true,
      reason: "Reads as real professional content.",
    });
  });

  it("returns 502 and reports to Sentry when the coherence check fails", async () => {
    mocks.checkCoherence.mockRejectedValue(new Error("groq down"));

    const { POST } = await import("@/app/api/ats-coherence/route");
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe(en.apiErrors.coherenceCheckFailed);
    expect(mocks.captureException).toHaveBeenCalled();
  });
});
