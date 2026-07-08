export type FontKey =
  | "inter"
  | "roboto"
  | "lato"
  | "montserrat"
  | "poppins"
  | "merriweather"
  | "playfair"
  | "lora"
  | "nunito"
  | "mono"
  | "oswald"
  | "raleway";

export interface FontOption {
  key: FontKey;
  name: string;
  variable: string;
}

// Each `variable` matches a CSS custom property registered by next/font in
// app/layout.tsx; the value there is a real font-family stack, so setting
// `fontFamily: var(--font-x)` anywhere picks it up.
const allFonts: FontOption[] = [
  { key: "inter", name: "Inter", variable: "var(--font-inter)" },
  { key: "roboto", name: "Roboto", variable: "var(--font-roboto)" },
  { key: "lato", name: "Lato", variable: "var(--font-lato)" },
  {
    key: "montserrat",
    name: "Montserrat",
    variable: "var(--font-montserrat)",
  },
  { key: "poppins", name: "Poppins", variable: "var(--font-poppins)" },
  {
    key: "merriweather",
    name: "Merriweather",
    variable: "var(--font-merriweather)",
  },
  {
    key: "playfair",
    name: "Playfair Display",
    variable: "var(--font-playfair)",
  },
  { key: "lora", name: "Lora", variable: "var(--font-lora)" },
  { key: "nunito", name: "Nunito", variable: "var(--font-nunito)" },
  { key: "mono", name: "Space Mono", variable: "var(--font-space-mono)" },
  { key: "oswald", name: "Oswald", variable: "var(--font-oswald)" },
  { key: "raleway", name: "Raleway", variable: "var(--font-raleway)" },
];

// Four fonts per row for the sidebar's Typography section.
const FONT_ROW_SIZE = 4;
export const fontRows: FontOption[][] = Array.from(
  { length: Math.ceil(allFonts.length / FONT_ROW_SIZE) },
  (_, i) => allFonts.slice(i * FONT_ROW_SIZE, (i + 1) * FONT_ROW_SIZE),
);

export const fontsByKey: Record<FontKey, FontOption> = Object.fromEntries(
  allFonts.map((font) => [font.key, font]),
) as Record<FontKey, FontOption>;
