/**
 * The Sidebar's accent-color swatch palette (rainbow hues darkened for
 * legibility, plus black/gray) and `getContrastTextColor`, which picks
 * black or white text to stay readable against an arbitrary user-picked
 * background (e.g. Modern's sidebar).
 */
export interface AccentColor {
  name: string;
  value: string;
}

const rainbowHues: AccentColor[] = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
];

export function mixChannels(hex: string, target: number, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const mix = (channel: number) =>
    Math.round(channel + (target - channel) * ratio);

  return (
    "#" +
    [mix(r), mix(g), mix(b)]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
  );
}

const mixWithBlack = (hex: string, ratio: number) => mixChannels(hex, 0, ratio);

const DARK_RATIO = 0.25;

// Stripped down to the essentials: the darkest tone of each rainbow hue,
// plus black and one neutral gray. No white — Sidebar.tsx appends a
// "custom color" swatch (native <input type="color">) as the last option.
const darkHues: AccentColor[] = rainbowHues.map((hue) => ({
  name: `${hue.name} Dark`,
  value: mixWithBlack(hue.value, DARK_RATIO),
}));

const allSwatches: AccentColor[] = [
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#808080" },
  ...darkHues,
];

// Split into two rows of roughly equal length. Sidebar.tsx appends a
// "custom color" swatch (native <input type="color">) to the end of the
// last row.
const ROW_SIZE = Math.ceil(allSwatches.length / 2);
export const rows: AccentColor[][] = [
  allSwatches.slice(0, ROW_SIZE),
  allSwatches.slice(ROW_SIZE),
];

// Picks black or white text so it stays readable on top of an arbitrary
// picked background color (e.g. Modern template's sidebar, which lets users
// set the background to any accent color).
export function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? "#000000" : "#ffffff";
}

// A flat, renderer-independent tint for pills/badges sitting on top of an
// arbitrary sidebar background (e.g. Elegant's skill tags) — baked into a
// single solid hex color rather than a translucent `rgba(...)` overlay,
// since `@react-pdf/renderer`'s PDF output and the on-screen CSS preview
// alpha-blend translucent fills in different color spaces, which made the
// same "18% white overlay" visibly washed-out/lighter in the downloaded PDF
// than in the live Preview. A solid color is identical in both by
// construction — same formula, same fixed result, no compositing involved.
export function tintBackground(baseHex: string, contrastText: string): string {
  return contrastText === "#ffffff"
    ? mixChannels(baseHex, 255, 0.18)
    : mixChannels(baseHex, 0, 0.08);
}
