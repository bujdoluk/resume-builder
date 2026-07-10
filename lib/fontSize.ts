import type { CSSProperties } from "react";

export type FontSizeKey = "small" | "medium" | "large";

export interface FontSizeOption {
  key: FontSizeKey;
  px: number;
}

// First iteration: three fixed sizes. "medium" (24px) is the baseline that
// matches the resume's existing, unscaled look.
export const fontSizeOptions: FontSizeOption[] = [
  { key: "small", px: 16 },
  { key: "medium", px: 24 },
  { key: "large", px: 32 },
];

export const defaultFontSizeKey: FontSizeKey = "medium";

const baselinePx =
  fontSizeOptions.find((option) => option.key === defaultFontSizeKey)?.px ??
  24;

// Sets --resume-font-scale on the resume's outer wrapper (paired with the
// "resume-scalable" class, see globals.css), which rescales only text-size
// rules — input widths, padding, and the photo box are driven by Tailwind's
// separate --spacing namespace and stay fixed.
export function getFontSizeStyle(key: FontSizeKey): CSSProperties {
  const option = fontSizeOptions.find((candidate) => candidate.key === key);
  const ratio = option ? option.px / baselinePx : 1;
  return { "--resume-font-scale": ratio } as CSSProperties;
}
