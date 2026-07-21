
import * as Flags from "country-flag-icons/react/3x2";

type FlagComponent = (typeof Flags)[keyof typeof Flags];

export interface LanguageOption {
  code: string;
  name: string;
  flag: FlagComponent;
}

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
