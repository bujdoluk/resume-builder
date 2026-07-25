import { describe, expect, it } from "vitest";
import { errorResponse } from "@/lib/apiErrors";
import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";

function requestWithLocale(locale?: string): Request {
  const headers = locale ? { [API_LOCALE_HEADER]: locale } : undefined;
  return new Request("https://example.com/api/test", { headers });
}

describe("errorResponse", () => {
  it("sets the given HTTP status", async () => {
    const response = errorResponse(429, "rateLimited", requestWithLocale());
    expect(response.status).toBe(429);
  });

  it("returns the English message when no locale header is present", async () => {
    const response = errorResponse(400, "invalidInput", requestWithLocale());
    const body = await response.json();
    expect(body.error).toBe("Invalid input.");
  });

  it("falls back to English for an unrecognized locale", async () => {
    const response = errorResponse(400, "invalidInput", requestWithLocale("xx"));
    const body = await response.json();
    expect(body.error).toBe("Invalid input.");
  });

  it("returns the localized message for a known, non-English locale", async () => {
    const response = errorResponse(400, "invalidInput", requestWithLocale("sk"));
    const body = await response.json();
    expect(body.error).toBe("Neplatný vstup.");
  });
});
