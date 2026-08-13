
import { GB, SK, CZ, DE, PL, PT, RU, ES, IT, FR, SE, NO, NL } from "country-flag-icons/react/3x2";

const flags = { GB, SK, CZ, DE, PL, PT, RU, ES, IT, FR, SE, NO, NL };

type Flag = (typeof flags)[keyof typeof flags];

export interface LanguageOption {
  code: string;
  name: string;
  flag: Flag;
}

const languageDefinitions = [
  { code: "en", name: "English (UK)", country: "GB" },
  { code: "sk", name: "Slovak", country: "SK" },
  { code: "cs", name: "Czech", country: "CZ" },
  { code: "de", name: "German", country: "DE" },
  { code: "pl", name: "Polish", country: "PL" },
  { code: "pt", name: "Portuguese", country: "PT" },
  { code: "ru", name: "Russian", country: "RU" },
  { code: "es", name: "Spanish", country: "ES" },
  { code: "it", name: "Italian", country: "IT" },
  { code: "fr", name: "French", country: "FR" },
  { code: "sv", name: "Swedish", country: "SE" },
  { code: "nb", name: "Norwegian", country: "NO" },
  { code: "nl", name: "Dutch", country: "NL" },
] as const;

export const languages: LanguageOption[] = languageDefinitions.map(
  ({ code, name, country }) => ({
    code,
    name,
    flag: flags[country as keyof typeof flags],
  }),
);

export const defaultLanguageCode = "en";

export function getLanguage(code: string): LanguageOption {
  return languages.find((option) => option.code === code) ?? languages[0]!;
}
