import { getGroqClient } from "@/lib/groq";

const MODEL = "openai/gpt-oss-20b";

export type RewriteStyle = "bullets" | "paragraph";

const NO_FABRICATION_RULE =
  "Only rephrase, restructure, and tighten the content the user already wrote. Do not invent new facts, duties, numbers, metrics, tools, or accomplishments that are not present in the original text. If the input mentions a number, percentage, or specific detail, you may keep or rephrase it, but never introduce a new one.";

const SYSTEM_PROMPTS: Record<RewriteStyle, string> = {
  bullets: `You rewrite a single work-experience or education description from a resume into stronger, more concise professional phrasing.

Rules:
- ${NO_FABRICATION_RULE}
- Prefer strong action verbs and concise, achievement-oriented phrasing where the input supports it.
- Preserve the original language of the input text — do not translate it.
- Keep roughly the same length; do not pad with filler.
- Return only the rewritten text, with no preamble, labels, or quotation marks.`,
  paragraph: `You rewrite the body paragraph of a cover letter into clearer, more professional prose.

Rules:
- ${NO_FABRICATION_RULE}
- Return a single flowing paragraph, not bullet points.
- Preserve the original language of the input text — do not translate it.
- Keep roughly the same length; do not pad with filler.
- Return only the rewritten text, with no preamble, labels, or quotation marks.`,
};

const REWRITE_SCHEMA = {
  type: "object",
  properties: {
    rewritten: { type: "string" },
  },
  required: ["rewritten"],
  additionalProperties: false,
};

export async function rewriteText(text: string, style: RewriteStyle): Promise<string> {
  const completion = await getGroqClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPTS[style] },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "text_rewrite",
        strict: true,
        schema: REWRITE_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return (JSON.parse(content) as { rewritten: string }).rewritten;
}
