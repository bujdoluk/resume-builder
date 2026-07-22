import type { KeywordMatchResult } from "@/lib/atsChecker/types";
import { KEYWORD_EXTRACTION_LIMIT } from "@/lib/constants";

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "all", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has",
  "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its",
  "itself", "just", "me", "more", "most", "my", "myself", "no", "nor",
  "not", "now", "of", "off", "on", "once", "only", "or", "other", "our",
  "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
  "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "we",
  "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "will", "with", "you", "your", "yours", "yourself", "yourselves",
  "etc", "including", "must", "also", "using", "use", "used", "able",
  "work", "role", "job", "team", "years", "year", "strong", "excellent",
  "looking", "candidate", "candidates", "applicant", "applicants",
]);

const TOKEN_PATTERN = /[a-z0-9]+(?:[+#]+|[.-][a-z0-9]+)*/g;

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(TOKEN_PATTERN) ?? [];
  return matches.filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

export function extractKeywords(jobDescription: string, limit = KEYWORD_EXTRACTION_LIMIT): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

export function matchKeywords(documentText: string, jobDescription: string): KeywordMatchResult {
  const keywords = extractKeywords(jobDescription);
  const documentTokens = new Set(tokenize(documentText));
  const matched = keywords.filter((keyword) => documentTokens.has(keyword));
  const missing = keywords.filter((keyword) => !documentTokens.has(keyword));
  const score = keywords.length === 0 ? 0 : Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}
