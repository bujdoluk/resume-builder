import { beforeEach, describe, expect, it, vi } from "vitest";
import { coverLetterDataSchema } from "@/lib/coverLetterData";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@/lib/groq", () => ({
  getGroqClient: () => ({ chat: { completions: { create: mocks.create } } }),
}));

function groqResponse(extracted: unknown) {
  return { choices: [{ message: { content: JSON.stringify(extracted) } }] };
}

const validExtraction = {
  senderName: "Jane Doe",
  senderAddress: "123 Main St, Springfield",
  senderEmail: "jane@example.com",
  senderPhone: "555-1234",
  date: "06-2024",
  recipientName: "Alex Recruiter",
  recipientCompany: "Acme Inc.",
  recipientState: "",
  recipientZipCode: "",
  recipientPhone: "",
  recipientEmail: "",
  subject: "Application for Senior Frontend Engineer",
  greeting: "Dear Alex,",
  body: "I would love to bring my experience to your team.",
  closing: "Best regards,",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseCoverLetterText", () => {
  it("maps a valid Groq extraction into a schema-valid CoverLetterData", async () => {
    mocks.create.mockResolvedValue(groqResponse(validExtraction));

    const { parseCoverLetterText } = await import("@/lib/coverLetterImport/parseCoverLetterText");
    const data = await parseCoverLetterText("Jane Doe cover letter text");

    expect(() => coverLetterDataSchema.parse(data)).not.toThrow();
    expect(data.senderName).toBe("Jane Doe");
    expect(data.recipientCompany).toBe("Acme Inc.");
    expect(data.greeting).toBe("Dear Alex,");
    expect(data.body).toBe("I would love to bring my experience to your team.");
  });

  it("degrades a malformed field via coverLetterDataSchema's .catch() defaults instead of throwing", async () => {
    mocks.create.mockResolvedValue(groqResponse({ senderName: "Jane Doe" }));

    const { parseCoverLetterText } = await import("@/lib/coverLetterImport/parseCoverLetterText");
    const data = await parseCoverLetterText("some text");

    expect(data.senderName).toBe("Jane Doe");
    expect(data.body).toBe("");
    expect(data.recipientCompany).toBe("");
  });

  it("throws when Groq returns an empty response", async () => {
    mocks.create.mockResolvedValue({ choices: [{ message: { content: null } }] });

    const { parseCoverLetterText } = await import("@/lib/coverLetterImport/parseCoverLetterText");
    await expect(parseCoverLetterText("some text")).rejects.toThrow("Groq returned an empty response.");
  });

  it("caps max_completion_tokens and sets a low reasoning effort", async () => {
    mocks.create.mockResolvedValue(groqResponse(validExtraction));

    const { parseCoverLetterText } = await import("@/lib/coverLetterImport/parseCoverLetterText");
    await parseCoverLetterText("Jane Doe cover letter text");

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 2000, reasoning_effort: "low" }),
    );
  });
});
