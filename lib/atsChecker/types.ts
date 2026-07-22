export interface FormatCheckItem {
  id: string;
  passed: boolean;
  labelKey: string;
}

export interface KeywordMatchResult {
  score: number;
  matched: string[];
  missing: string[];
}
