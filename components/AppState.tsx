"use client";

/**
 * Global editor state shared across every page via React context: the
 * active template, accent color, font, font size, section order, visible
 * personal-info fields, selected language, and a version counter used to
 * signal that the saved resume list changed. Mounted once in the root
 * layout so both the persistent `Sidebar`/Navbar and the `/app` editor
 * read/write the same state — in particular, switching templates via the
 * Navbar's Templates dropdown just updates `templateId` here (no
 * navigation), so `ResumeBuilder.tsx`'s in-memory resume `data` is never touched.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { allCoverLetterFields, type CoverLetterFieldKey } from "@/lib/coverLetterFields";
import type {
  CoverLetterSectionKey,
  CoverLetterSectionZones,
} from "@/lib/coverLetterSections";
import {
  defaultCoverLetterTemplateId,
  type CoverLetterTemplateId,
} from "@/lib/coverLetterTemplates";
import { allFields, fieldLabels, type FieldKey } from "@/lib/fields";
import { defaultFontSizeKey, type FontSizeKey } from "@/lib/fontSize";
import { allFonts, type FontKey } from "@/lib/fonts";
import i18n from "@/lib/i18n/i18n";
import { defaultLanguageCode } from "@/lib/i18n/languages";
import type { ModernSectionZones, SectionKey } from "@/lib/resumeData";
import { defaultTemplateId, type TemplateId } from "@/lib/templates";

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
  "languages",
  "certifications",
  "interests",
];

export const defaultSectionOrder: SectionKey[] = [...allSections];

const defaultVisibleFields: FieldKey[] = [...allFields];
const defaultCoverLetterFieldOrder: CoverLetterFieldKey[] = [
  ...allCoverLetterFields,
];

// Live snapshots of each builder's completion-steps checklist, published by
// `ResumeBuilder.tsx`/`CoverLetterBuilder.tsx` (while mounted) and consumed
// by `Sidebar.tsx` to show the same checklist under "My Resumes"/"My Cover
// Letters" respectively — `null` whenever the corresponding editor isn't
// mounted, so the sidebar shows nothing extra on any other page.
export interface ResumeStepsSummary {
  // Resume steps include the synthetic "personalInfo" key alongside
  // `SectionKey`s (see `ResumeBuilder.tsx`), so this stays a plain string
  // rather than `SectionKey[]`.
  stepKeys: string[];
  incompleteKeys: string[];
  completionPercent: number;
}

export interface CoverLetterStepsSummary {
  stepKeys: CoverLetterSectionKey[];
  incompleteKeys: CoverLetterSectionKey[];
  completionPercent: number;
}

interface AppStateValue {
  templateId: TemplateId;
  setTemplateId: Dispatch<SetStateAction<TemplateId>>;
  color: string | null;
  setColor: Dispatch<SetStateAction<string | null>>;
  font: FontKey | null;
  setFont: Dispatch<SetStateAction<FontKey | null>>;
  sectionOrder: SectionKey[];
  setSectionOrder: Dispatch<SetStateAction<SectionKey[]>>;
  visibleFields: FieldKey[];
  setVisibleFields: Dispatch<SetStateAction<FieldKey[]>>;
  // Combines order + visibility for the cover letter's fields, same
  // convention as the resume's `visibleFields` (a hidden field is simply
  // absent from the array; re-showing one appends it at the end rather than
  // restoring its old position). Shared globally like `color`/`font`/
  // `fontSize`/`templateId` — only one editor is active at a time.
  coverLetterFieldOrder: CoverLetterFieldKey[];
  setCoverLetterFieldOrder: Dispatch<SetStateAction<CoverLetterFieldKey[]>>;
  coverLetterTemplateId: CoverLetterTemplateId;
  setCoverLetterTemplateId: Dispatch<SetStateAction<CoverLetterTemplateId>>;
  modernSectionZones: ModernSectionZones;
  setModernSectionZones: Dispatch<SetStateAction<ModernSectionZones>>;
  // Cover letter counterpart of `modernSectionZones` — which of the Modern
  // cover letter template's two zones (sidebar/main) each section renders
  // in. Basic ignores this.
  coverLetterSectionZones: CoverLetterSectionZones;
  setCoverLetterSectionZones: Dispatch<SetStateAction<CoverLetterSectionZones>>;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  fontSize: FontSizeKey;
  setFontSize: Dispatch<SetStateAction<FontSizeKey>>;
  resumeListVersion: number;
  notifyResumeListChanged: () => void;
  coverLetterListVersion: number;
  notifyCoverLetterListChanged: () => void;
  lastEditorPath: string;
  setLastEditorPath: Dispatch<SetStateAction<string>>;
  resumeStepsSummary: ResumeStepsSummary | null;
  setResumeStepsSummary: Dispatch<SetStateAction<ResumeStepsSummary | null>>;
  coverLetterStepsSummary: CoverLetterStepsSummary | null;
  setCoverLetterStepsSummary: Dispatch<SetStateAction<CoverLetterStepsSummary | null>>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

// Shared state that both the sidebar (rendered once in the root layout) and
// the resume editor page need — lifted up here so the sidebar's "Features"
// checklist (sections + personal-info fields) and accent color picker work
// on every page, not just "/".
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [templateId, setTemplateId] = useState<TemplateId>(defaultTemplateId);
  const [color, setColor] = useState<string | null>(null);
  const [font, setFont] = useState<FontKey | null>(defaultFont);
  const [sectionOrder, setSectionOrder] =
    useState<SectionKey[]>(defaultSectionOrder);
  const [visibleFields, setVisibleFields] = useState<FieldKey[]>(
    defaultVisibleFields,
  );
  const [coverLetterFieldOrder, setCoverLetterFieldOrder] = useState<
    CoverLetterFieldKey[]
  >(defaultCoverLetterFieldOrder);
  const [coverLetterTemplateId, setCoverLetterTemplateId] =
    useState<CoverLetterTemplateId>(defaultCoverLetterTemplateId);
  const [modernSectionZones, setModernSectionZones] =
    useState<ModernSectionZones>({});
  const [coverLetterSectionZones, setCoverLetterSectionZones] =
    useState<CoverLetterSectionZones>({});
  const [language, setLanguage] = useState<string>(defaultLanguageCode);
  const [fontSize, setFontSize] = useState<FontSizeKey>(defaultFontSizeKey);
  const [resumeListVersion, setResumeListVersion] = useState(0);
  const notifyResumeListChanged = () =>
    setResumeListVersion((version) => version + 1);
  const [coverLetterListVersion, setCoverLetterListVersion] = useState(0);
  const notifyCoverLetterListChanged = () =>
    setCoverLetterListVersion((version) => version + 1);
  // The editor (ResumeBuilder.tsx) keeps this pointed at its own current URL
  // (including ?resumeId=/&template= once a saved resume is loaded), so the
  // Sidebar's "Back to editor" link — visible from /my-resumes and
  // /templates — returns to the exact resume the user was just editing
  // instead of always landing on a blank one.
  const [lastEditorPath, setLastEditorPath] = useState("/app");
  const [resumeStepsSummary, setResumeStepsSummary] =
    useState<ResumeStepsSummary | null>(null);
  const [coverLetterStepsSummary, setCoverLetterStepsSummary] =
    useState<CoverLetterStepsSummary | null>(null);

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
        templateId,
        setTemplateId,
        color,
        setColor,
        font,
        setFont,
        sectionOrder,
        setSectionOrder,
        visibleFields,
        setVisibleFields,
        coverLetterFieldOrder,
        setCoverLetterFieldOrder,
        coverLetterTemplateId,
        setCoverLetterTemplateId,
        modernSectionZones,
        setModernSectionZones,
        coverLetterSectionZones,
        setCoverLetterSectionZones,
        language,
        setLanguage,
        fontSize,
        setFontSize,
        resumeListVersion,
        notifyResumeListChanged,
        coverLetterListVersion,
        notifyCoverLetterListChanged,
        lastEditorPath,
        setLastEditorPath,
        resumeStepsSummary,
        setResumeStepsSummary,
        coverLetterStepsSummary,
        setCoverLetterStepsSummary,
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
