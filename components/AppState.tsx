"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { allFields, fieldLabels, type FieldKey } from "@/lib/fields";
import { defaultFontSizeKey, type FontSizeKey } from "@/lib/fontSize";
import { allFonts, type FontKey } from "@/lib/fonts";
import i18n from "@/lib/i18n/i18n";
import { defaultLanguageCode } from "@/lib/i18n/languages";
import type { SectionKey } from "@/lib/resumeData";

// Typography defaults to the first font in the list rather than leaving the
// page's plain system font in place, so the sidebar's font select always
// reflects a real, named choice.
const defaultFont: FontKey = allFonts[0].key;

// Re-exported for existing call sites (Sidebar.tsx, Resume.tsx) — the
// underlying data lives in lib/fields.ts, a plain module without "use
// client", so read-only Server Components (e.g. the /templates gallery)
// can import it directly without pulling in this client-only file.
export { allFields, fieldLabels, type FieldKey };

export const allSections: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "certifications",
  "languages",
  "interests",
];

// Certifications is opt-in: it's a valid section for any template, but
// starts out of sectionOrder so it only appears once toggled on via the
// sidebar's "Features" checklist.
export const defaultSectionOrder: SectionKey[] = allSections.filter(
  (key) => key !== "certifications",
);

// Every personal-info field is visible by default.
const defaultVisibleFields: FieldKey[] = [...allFields];

interface AppStateValue {
  color: string | null;
  setColor: Dispatch<SetStateAction<string | null>>;
  font: FontKey | null;
  setFont: Dispatch<SetStateAction<FontKey | null>>;
  sectionOrder: SectionKey[];
  setSectionOrder: Dispatch<SetStateAction<SectionKey[]>>;
  visibleFields: FieldKey[];
  setVisibleFields: Dispatch<SetStateAction<FieldKey[]>>;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  fontSize: FontSizeKey;
  setFontSize: Dispatch<SetStateAction<FontSizeKey>>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

// Shared state that both the sidebar (rendered once in the root layout) and
// the resume editor page need — lifted up here so the sidebar's "Features"
// checklist (sections + personal-info fields) and accent color picker work
// on every page, not just "/".
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string | null>(null);
  const [font, setFont] = useState<FontKey | null>(defaultFont);
  const [sectionOrder, setSectionOrder] =
    useState<SectionKey[]>(defaultSectionOrder);
  const [visibleFields, setVisibleFields] = useState<FieldKey[]>(
    defaultVisibleFields,
  );
  const [language, setLanguage] = useState<string>(defaultLanguageCode);
  const [fontSize, setFontSize] = useState<FontSizeKey>(defaultFontSizeKey);

  // Language switching is client-only (no URL routing), so the server
  // always renders with the default language and this effect applies the
  // user's pick after hydration, keeping every useTranslation() consumer
  // (Sidebar, Resume, etc.) in sync with a single source of truth.
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <AppStateContext.Provider
      value={{
        color,
        setColor,
        font,
        setFont,
        sectionOrder,
        setSectionOrder,
        visibleFields,
        setVisibleFields,
        language,
        setLanguage,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
