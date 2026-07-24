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

const defaultFont: FontKey = allFonts[0].key;

export { allFields, fieldLabels, type FieldKey };

export const allSections: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "languages",
  "certifications",
  "interests",
  "customFields",
];

export const defaultSectionOrder: SectionKey[] = [...allSections];

const defaultVisibleFields: FieldKey[] = [...allFields];
const defaultCoverLetterFieldOrder: CoverLetterFieldKey[] = [
  ...allCoverLetterFields,
];

export interface ResumeStepsSummary {

  stepKeys: string[];
  incompleteKeys: string[];
  completionPercent: number;
  customFieldsTitle?: string;
}

export interface CoverLetterStepsSummary {
  stepKeys: CoverLetterSectionKey[];
  incompleteKeys: CoverLetterSectionKey[];
  completionPercent: number;
  customFieldsTitle?: string;
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

  coverLetterFieldOrder: CoverLetterFieldKey[];
  setCoverLetterFieldOrder: Dispatch<SetStateAction<CoverLetterFieldKey[]>>;
  coverLetterTemplateId: CoverLetterTemplateId;
  setCoverLetterTemplateId: Dispatch<SetStateAction<CoverLetterTemplateId>>;
  modernSectionZones: ModernSectionZones;
  setModernSectionZones: Dispatch<SetStateAction<ModernSectionZones>>;

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

  const [lastEditorPath, setLastEditorPath] = useState("/app");
  const [resumeStepsSummary, setResumeStepsSummary] =
    useState<ResumeStepsSummary | null>(null);
  const [coverLetterStepsSummary, setCoverLetterStepsSummary] =
    useState<CoverLetterStepsSummary | null>(null);

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
