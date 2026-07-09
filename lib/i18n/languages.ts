import * as Flags from "country-flag-icons/react/3x2";

type FlagComponent = (typeof Flags)[keyof typeof Flags];

export interface LanguageOption {
  code: string;
  name: string;
  flag: FlagComponent;
}

// `flagCountry` is an ISO 3166-1 alpha-2 country code, looked up against
// country-flag-icons' bundled SVGs — kept separate from `code` (BCP 47
// language code, matching lib/i18n/i18n.ts) since several languages here
// map to a country whose code differs from the language code itself (e.g.
// Swedish "sv" -> Sweden "SE", Norwegian "nb" -> Norway "NO").
const languageDefinitions = [
  { code: "en", name: "English (UK)", flagCountry: "GB" },
  { code: "sk", name: "Slovak", flagCountry: "SK" },
  { code: "cs", name: "Czech", flagCountry: "CZ" },
  { code: "de", name: "German", flagCountry: "DE" },
  { code: "pl", name: "Polish", flagCountry: "PL" },
  { code: "pt", name: "Portuguese", flagCountry: "PT" },
  { code: "ru", name: "Russian", flagCountry: "RU" },
  { code: "es", name: "Spanish", flagCountry: "ES" },
  { code: "it", name: "Italian", flagCountry: "IT" },
  { code: "fr", name: "French", flagCountry: "FR" },
  { code: "sv", name: "Swedish", flagCountry: "SE" },
  { code: "nb", name: "Norwegian", flagCountry: "NO" },
  { code: "nl", name: "Dutch", flagCountry: "NL" },
] as const;

export const languages: LanguageOption[] = languageDefinitions.map(
  ({ code, name, flagCountry }) => ({
    code,
    name,
    flag: Flags[flagCountry as keyof typeof Flags],
  }),
);

export const defaultLanguageCode = "en";
