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

const darkHues: AccentColor[] = rainbowHues.map((hue) => ({
  name: `${hue.name} Dark`,
  value: mixWithBlack(hue.value, DARK_RATIO),
}));

const allSwatches: AccentColor[] = [
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#808080" },
  ...darkHues,
];

const ROW_SIZE = Math.ceil(allSwatches.length / 2);
export const rows: AccentColor[][] = [
  allSwatches.slice(0, ROW_SIZE),
  allSwatches.slice(ROW_SIZE),
];

export function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? "#000000" : "#ffffff";
}

// A solid color instead of rgba: react-pdf and CSS blend alpha differently, so the PDF looked washed out.
export function tintBackground(baseHex: string, contrastText: string): string {
  return contrastText === "#ffffff"
    ? mixChannels(baseHex, 255, 0.18)
    : mixChannels(baseHex, 0, 0.08);
}
