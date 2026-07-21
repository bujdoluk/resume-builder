
import type { CSSProperties } from "react";

export type FontSizeKey = "small" | "smallMedium" | "medium" | "mediumLarge" | "large";

export interface FontSizeOption {
  key: FontSizeKey;
  px: number;
}

export const fontSizeOptions: FontSizeOption[] = [
  { key: "small", px: 16 },
  { key: "smallMedium", px: 20 },
  { key: "medium", px: 24 },
  { key: "mediumLarge", px: 28 },
  { key: "large", px: 32 },
];

export const defaultFontSizeKey: FontSizeKey = "medium";

const baselinePx =
  fontSizeOptions.find((option) => option.key === defaultFontSizeKey)?.px ??
  24;

export function getFontScaleRatio(key: FontSizeKey): number {
  const option = fontSizeOptions.find((candidate) => candidate.key === key);
  return option ? option.px / baselinePx : 1;
}

export function getFontSizeStyle(key: FontSizeKey): CSSProperties {
  return { "--resume-font-scale": getFontScaleRatio(key) } as CSSProperties;
}
