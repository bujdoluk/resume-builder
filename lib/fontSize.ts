/**
 * The Sidebar's "Font Size" control (small/small-medium/medium/medium-large/
 * large): computes a scale ratio relative to the "medium" baseline and
 * exposes it as a CSS custom property (`--resume-font-scale`) that
 * `app/globals.css`'s `.resume-scalable` rules read to rescale only
 * text-size utilities.
 */
import type { CSSProperties } from "react";

export type FontSizeKey = "small" | "smallMedium" | "medium" | "mediumLarge" | "large";

export interface FontSizeOption {
  key: FontSizeKey;
  px: number;
}

// Five fixed sizes, evenly spaced by 4px. "medium" (24px) is the baseline
// that matches the resume's existing, unscaled look.
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

// Sets --resume-font-scale on the resume's outer wrapper (paired with the
// "resume-scalable" class, see globals.css), which rescales only text-size
// rules — input widths, padding, and the photo box are driven by Tailwind's
// separate --spacing namespace and stay fixed.
export function getFontSizeStyle(key: FontSizeKey): CSSProperties {
  return { "--resume-font-scale": getFontScaleRatio(key) } as CSSProperties;
}
