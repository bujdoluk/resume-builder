import Groq from "groq-sdk";

let client: Groq | null | undefined;

export function getGroqClient(): Groq {
  if (client === undefined) {
    client = process.env.GROQ_API_KEY ? new Groq() : null;
  }
  if (!client) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return client;
}
