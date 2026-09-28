import { getGroqClient } from "@/lib/groq";
import { languageLevels, resumeDataSchema, type ResumeData } from "@/lib/resumeData";

const MODEL = "openai/gpt-oss-20b";

// reasoning_effort low stops gpt-oss-20b burning its token budget on reasoning.
// Groq rate limits on the requested max_completion_tokens, so keep it bounded.
// 4000 fits dense resumes, which use about 1200.
const MAX_COMPLETION_TOKENS = 4000;
const REASONING_EFFORT = "low";

const SYSTEM_PROMPT = `You extract structured resume data from raw text pulled from an uploaded resume file (PDF or Word).

Rules:
- Only extract information that is actually present in the text. Never invent a name, job title, dates, employer, skill, or any other detail that isn't there.
- If a field isn't present anywhere in the text, return it as an empty string (or omit the entry/array item it belongs to).
- Preserve the original language and wording of the source text — do not translate or rephrase it.
- For each language entry, pick the closest matching proficiency level from the given enum based on how it's described in the text (e.g. "native" or "mother tongue" -> Native Speaker, "fluent" or "C1"/"C2" -> Full Professional Proficiency, "intermediate" or "B1"/"B2" -> Advanced, "basic" or "A1"/"A2" -> Beginner). If no level is stated, pick the closest reasonable guess rather than leaving it blank.
- Keep dates in whatever format they appear in the source text.
- Return only the structured data — no commentary.`;

const ENTRY_TEXT = { type: "string" } as const;

const RESUME_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    name: ENTRY_TEXT,
    jobTitle: ENTRY_TEXT,
    phone: ENTRY_TEXT,
    email: ENTRY_TEXT,
    address: ENTRY_TEXT,
    website: ENTRY_TEXT,
    linkedin: ENTRY_TEXT,
    aboutMe: ENTRY_TEXT,
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: ENTRY_TEXT,
          dateFrom: ENTRY_TEXT,
          dateTo: ENTRY_TEXT,
          location: ENTRY_TEXT,
          jobDescription: ENTRY_TEXT,
        },
        required: ["position", "dateFrom", "dateTo", "location", "jobDescription"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: ENTRY_TEXT,
          subject: ENTRY_TEXT,
          location: ENTRY_TEXT,
          description: ENTRY_TEXT,
          dateFrom: ENTRY_TEXT,
          dateTo: ENTRY_TEXT,
        },
        required: ["school", "subject", "location", "description", "dateFrom", "dateTo"],
        additionalProperties: false,
      },
    },
    skills: { type: "array", items: ENTRY_TEXT },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: ENTRY_TEXT,
          dateFrom: ENTRY_TEXT,
          dateTo: ENTRY_TEXT,
        },
        required: ["name", "dateFrom", "dateTo"],
        additionalProperties: false,
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: ENTRY_TEXT,
          level: { type: "string", enum: languageLevels },
        },
        required: ["language", "level"],
        additionalProperties: false,
      },
    },
    interests: { type: "array", items: ENTRY_TEXT },
  },
  required: [
    "name",
    "jobTitle",
    "phone",
    "email",
    "address",
    "website",
    "linkedin",
    "aboutMe",
    "workExperience",
    "education",
    "skills",
    "certifications",
    "languages",
    "interests",
  ],
  additionalProperties: false,
};

interface ExtractedResume {
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  linkedin: string;
  aboutMe: string;
  workExperience: { position: string; dateFrom: string; dateTo: string; location: string; jobDescription: string }[];
  education: { school: string; subject: string; location: string; description: string; dateFrom: string; dateTo: string }[];
  skills: string[];
  certifications: { name: string; dateFrom: string; dateTo: string }[];
  languages: { language: string; level: string }[];
  interests: string[];
}

export async function parseResumeText(text: string): Promise<ResumeData> {
  const completion = await getGroqClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    reasoning_effort: REASONING_EFFORT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_extraction",
        strict: true,
        schema: RESUME_EXTRACTION_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const extracted = JSON.parse(content) as ExtractedResume;

  return resumeDataSchema.parse({
    ...extracted,
    workExperience: extracted.workExperience.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    education: extracted.education.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    skills: extracted.skills.map((value) => ({ id: crypto.randomUUID(), value })),
    certifications: extracted.certifications.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    languages: extracted.languages.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    interests: extracted.interests.map((value) => ({ id: crypto.randomUUID(), value })),
  });
}
