import Groq from "groq-sdk";

const MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You review text from a resume or cover letter for basic coherence.

Determine whether the text reads as real, sensible language describing plausible professional content (work experience, education, skills, etc.), as opposed to placeholder text, randomly generated filler, or nonsensical gibberish.

Do not judge writing quality, grammar, formatting, or career choices. Do not attempt to verify that any claim is factually true — you have no way to check that. Only judge whether the text is coherent, real language versus meaningless or random text.

Respond with the given JSON schema. "reason" must be a single short sentence explaining your judgment.`;

const COHERENCE_SCHEMA = {
  type: "object",
  properties: {
    coherent: { type: "boolean" },
    reason: { type: "string" },
  },
  required: ["coherent", "reason"],
  additionalProperties: false,
};

let client: Groq | null | undefined;

function getGroqClient(): Groq {
  if (client === undefined) {
    client = process.env.GROQ_API_KEY ? new Groq() : null;
  }
  if (!client) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return client;
}

export async function checkCoherence(text: string): Promise<{ coherent: boolean; reason: string }> {
  const completion = await getGroqClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "coherence_check",
        strict: true,
        schema: COHERENCE_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return JSON.parse(content) as { coherent: boolean; reason: string };
}
