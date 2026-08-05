import { Font } from "@react-pdf/renderer";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyResumeData, type ResumeData } from "@/lib/resumeData";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getResumeByShareToken: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getRequestIp: () => "203.0.113.1",
}));

vi.mock("@/lib/supabase/resumes", () => ({
  getResumeByShareToken: mocks.getResumeByShareToken,
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

const resumeData: ResumeData = {
  ...emptyResumeData,
  name: "Jane Doe",
  email: "jane.doe@example.com",
};

const fakeResumeRow = {
  id: "resume-1",
  name: "My Resume",
  templateId: "basic" as const,
  color: null,
  font: null,
  fontSize: null,
  sectionOrder: [],
  visibleFields: [],
  modernSectionZones: {},
  data: resumeData,
  shareToken: "a-token",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function pdfRequest(token: string): [Request, { params: Promise<{ token: string }> }] {
  return [
    new Request(`https://example.com/shared/resume/${token}/pdf`),
    { params: Promise.resolve({ token }) },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.getResumeByShareToken.mockResolvedValue(fakeResumeRow);
});

describe("GET /shared/resume/[token]/pdf", () => {
  it("returns 429 and never looks up the resume when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);

    const { GET } = await import("@/app/shared/resume/[token]/pdf/route");
    const response = await GET(...pdfRequest("a-token"));

    expect(response.status).toBe(429);
    expect(mocks.getResumeByShareToken).not.toHaveBeenCalled();
  });

  it("returns 404 when no resume matches the token", async () => {
    mocks.getResumeByShareToken.mockResolvedValue(null);

    const { GET } = await import("@/app/shared/resume/[token]/pdf/route");
    const response = await GET(...pdfRequest("missing-token"));

    expect(response.status).toBe(404);
  });

  it("returns a valid PDF for a matching token", async () => {
    const { GET } = await import("@/app/shared/resume/[token]/pdf/route");
    const response = await GET(...pdfRequest("a-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
