import { Font } from "@react-pdf/renderer";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getCoverLetterByShareToken: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/supabase/coverLetters", () => ({
  getCoverLetterByShareToken: mocks.getCoverLetterByShareToken,
}));

vi.mock("@/lib/supabase/serviceRole", () => ({
  createServiceRoleClient: () => ({}),
}));

// Same font-registration workaround as __tests__/lib/pdf/pdfTemplates.test.tsx
// — every PDF template defaults to "inter" when no font is given, and
// @react-pdf throws unless it's registered. Aliasing it to a built-in PDF
// font avoids a real network fetch to Google Fonts in this test.
beforeAll(() => {
  Font.register({
    family: "inter",
    fonts: [
      { src: "Helvetica", fontWeight: "normal" },
      { src: "Helvetica-Bold", fontWeight: "bold" },
    ],
  });
});

const coverLetterData: CoverLetterData = {
  ...emptyCoverLetterData,
  senderName: "Jane Doe",
  greeting: "Dear Hiring Manager,",
  body: "I would love to bring my experience to your team.",
};

const fakeCoverLetterRow = {
  id: "cover-letter-1",
  name: "My Cover Letter",
  data: coverLetterData,
  shareToken: "a-token",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function pdfRequest(token: string): [Request, { params: Promise<{ token: string }> }] {
  return [
    new Request(`https://example.com/shared/cover-letter/${token}/pdf`),
    { params: Promise.resolve({ token }) },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.getCoverLetterByShareToken.mockResolvedValue(fakeCoverLetterRow);
});

describe("GET /shared/cover-letter/[token]/pdf", () => {
  it("returns 429 and never looks up the cover letter when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { GET } = await import("@/app/shared/cover-letter/[token]/pdf/route");
    const response = await GET(...pdfRequest("a-token"));

    expect(response.status).toBe(429);
    expect(mocks.getCoverLetterByShareToken).not.toHaveBeenCalled();
  });

  it("returns 404 when no cover letter matches the token", async () => {
    mocks.getCoverLetterByShareToken.mockResolvedValue(null);

    const { GET } = await import("@/app/shared/cover-letter/[token]/pdf/route");
    const response = await GET(...pdfRequest("missing-token"));

    expect(response.status).toBe(404);
  });

  it("returns a valid PDF for a matching token", async () => {
    const { GET } = await import("@/app/shared/cover-letter/[token]/pdf/route");
    const response = await GET(...pdfRequest("a-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
