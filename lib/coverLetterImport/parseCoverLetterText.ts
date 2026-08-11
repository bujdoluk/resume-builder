import { getGroqClient } from "@/lib/groq";
import { coverLetterDataSchema, type CoverLetterData } from "@/lib/coverLetterData";

const MODEL = "openai/gpt-oss-20b";

// Same reasoning-model calibration as lib/resumeImport/parseResumeText.ts —
// see that file for the full explanation (wasted reasoning tokens, and
// Groq's per-account TPM limit being enforced against the requested
// max_completion_tokens ceiling rather than actual usage). A cover letter
// is far shorter than a resume, so this budget is already generous.
const MAX_COMPLETION_TOKENS = 2000;
const REASONING_EFFORT = "low";

const SYSTEM_PROMPT = `You extract structured cover letter data from raw text pulled from an uploaded cover letter file (PDF or Word).

Rules:
- Only extract information that is actually present in the text. Never invent a sender/recipient name, company, date, or any other detail that isn't there.
- If a field isn't present anywhere in the text, return it as an empty string.
- Preserve the original language and wording of the source text — do not translate or rephrase it.
- Only extract "date" if an actual date is written in the letter (e.g. a dateline near the top). Never invent today's date or any other date that isn't literally present.
- Split the letter into its natural parts: "greeting" is the salutation line (e.g. "Dear Hiring Manager,"), "body" is the paragraph(s) in between, and "closing" is the sign-off line before the sender's name (e.g. "Sincerely,"). Do not include the sender's name itself in "closing".
- Return only the structured data — no commentary.`;

const FIELD = { type: "string" } as const;

const COVER_LETTER_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    senderName: FIELD,
    senderAddress: FIELD,
    senderEmail: FIELD,
    senderPhone: FIELD,
    date: FIELD,
    recipientName: FIELD,
    recipientCompany: FIELD,
    recipientState: FIELD,
    recipientZipCode: FIELD,
    recipientPhone: FIELD,
    recipientEmail: FIELD,
    subject: FIELD,
    greeting: FIELD,
    body: FIELD,
    closing: FIELD,
  },
  required: [
    "senderName",
    "senderAddress",
    "senderEmail",
    "senderPhone",
    "date",
    "recipientName",
    "recipientCompany",
    "recipientState",
    "recipientZipCode",
    "recipientPhone",
    "recipientEmail",
    "subject",
    "greeting",
    "body",
    "closing",
  ],
  additionalProperties: false,
};

type ExtractedCoverLetter = Omit<CoverLetterData, "customFieldValue" | "customFieldsTitle">;

/**
 * Turns raw cover letter text into a trustworthy CoverLetterData. Unlike
 * resume extraction, there are no arrays/ids to mint here — the Groq output
 * already matches coverLetterDataSchema's shape field-for-field, so it goes
 * straight through .parse() (whose per-field .catch() defaults still
 * protect against a malformed/partial model response).
 */
export async function parseCoverLetterText(text: string): Promise<CoverLetterData> {
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
        name: "cover_letter_extraction",
        strict: true,
        schema: COVER_LETTER_EXTRACTION_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const extracted = JSON.parse(content) as ExtractedCoverLetter;

  return coverLetterDataSchema.parse(extracted);
}
