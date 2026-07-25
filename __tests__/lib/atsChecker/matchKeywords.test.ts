import { describe, expect, it } from "vitest";
import { extractKeywords, matchKeywords } from "@/lib/atsChecker/matchKeywords";

describe("extractKeywords", () => {
  it("filters out stopwords", () => {
    const keywords = extractKeywords("We are looking for a candidate with React and Python experience");
    expect(keywords).toContain("react");
    expect(keywords).toContain("python");
    expect(keywords).not.toContain("looking");
    expect(keywords).not.toContain("candidate");
    expect(keywords).not.toContain("with");
  });

  it("orders keywords by frequency, most frequent first", () => {
    const keywords = extractKeywords("Python Python Python React React SQL");
    expect(keywords.slice(0, 3)).toEqual(["python", "react", "sql"]);
  });

  it("truncates to the given limit", () => {
    const keywords = extractKeywords("alpha beta gamma delta epsilon", 2);
    expect(keywords).toHaveLength(2);
  });
});

describe("matchKeywords", () => {
  it("scores 100 when every keyword from the job description appears in the document", () => {
    const result = matchKeywords("I have Python and React experience", "Python React");
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it("scores 0 when no keywords from the job description appear in the document", () => {
    const result = matchKeywords("I enjoy painting and hiking", "Python React SQL");
    expect(result.score).toBe(0);
    expect(result.matched).toHaveLength(0);
  });

  it("scores 0, not NaN, when the job description has no extractable keywords", () => {
    const result = matchKeywords("Python React", "the a an and or but");
    expect(result.score).toBe(0);
  });

  it("splits matched and missing keywords correctly for a partial match", () => {
    const result = matchKeywords("Strong Python skills", "Python React SQL");
    expect(result.matched).toEqual(["python"]);
    expect(result.missing).toEqual(["react", "sql"]);
    expect(result.score).toBe(Math.round((1 / 3) * 100));
  });
});
