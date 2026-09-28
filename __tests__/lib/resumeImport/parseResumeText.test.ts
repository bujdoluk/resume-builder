import { beforeEach, describe, expect, it, vi } from "vitest";
import { resumeDataSchema } from "@/lib/resumeData";

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
  name: "Jane Doe",
  jobTitle: "Senior Software Engineer",
  phone: "555-1234",
  email: "jane@example.com",
  address: "",
  website: "",
  linkedin: "",
  aboutMe: "Experienced engineer.",
  workExperience: [
    {
      position: "Engineer",
      dateFrom: "2020",
      dateTo: "2024",
      location: "Remote",
      jobDescription: "Built things.",
    },
  ],
  education: [],
  skills: ["React", "TypeScript"],
  certifications: [],
  languages: [{ language: "English", level: "Native Speaker" }],
  interests: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseResumeText", () => {
  it("maps a valid Groq extraction into a schema-valid ResumeData with fresh ids", async () => {
    mocks.create.mockResolvedValue(groqResponse(validExtraction));

    const { parseResumeText } = await import("@/lib/resumeImport/parseResumeText");
    const data = await parseResumeText("Jane Doe resume text");

    expect(() => resumeDataSchema.parse(data)).not.toThrow();
    expect(data.name).toBe("Jane Doe");
    expect(data.workExperience).toHaveLength(1);
    expect(data.workExperience[0]!.id).toBeTruthy();
    expect(data.skills.map((s) => s.value)).toEqual(["React", "TypeScript"]);
    expect(data.skills[0]!.id).toBeTruthy();
    expect(data.languages[0]).toMatchObject({ language: "English", level: "Native Speaker" });
  });

  it("caps max_completion_tokens and sets a low reasoning effort", async () => {
    // gpt-oss-20b can burn its budget on reasoning, and Groq rate limits on the requested max_completion_tokens. See parseResumeText.ts.
    mocks.create.mockResolvedValue(groqResponse(validExtraction));

    const { parseResumeText } = await import("@/lib/resumeImport/parseResumeText");
    await parseResumeText("Jane Doe resume text");

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 4000, reasoning_effort: "low" }),
    );
  });

  it("degrades a malformed field via resumeDataSchema's .catch() defaults instead of throwing", async () => {
    mocks.create.mockResolvedValue(
      groqResponse({ ...validExtraction, workExperience: [{ position: "Engineer" }] }),
    );

    const { parseResumeText } = await import("@/lib/resumeImport/parseResumeText");
    const data = await parseResumeText("some text");

    expect(data.workExperience[0]!.position).toBe("Engineer");
    expect(data.workExperience[0]!.dateFrom).toBe("");
  });

  it("throws when Groq returns an empty response", async () => {
    mocks.create.mockResolvedValue({ choices: [{ message: { content: null } }] });

    const { parseResumeText } = await import("@/lib/resumeImport/parseResumeText");
    await expect(parseResumeText("some text")).rejects.toThrow("Groq returned an empty response.");
  });
});
