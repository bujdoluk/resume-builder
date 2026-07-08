"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { FontKey } from "@/lib/fonts";
import type { SectionKey } from "@/lib/resumeData";

export const allSections: SectionKey[] = [
  "workHistory",
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

export type FieldKey =
  | "photo"
  | "title"
  | "name"
  | "jobTitle"
  | "phone"
  | "email"
  | "address"
  | "website"
  | "linkedin"
  | "aboutMe";

export const allFields: FieldKey[] = [
  "photo",
  "title",
  "name",
  "jobTitle",
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
  "aboutMe",
];

export const fieldLabels: Record<FieldKey, string> = {
  photo: "Photo",
  title: "Title",
  name: "Name",
  jobTitle: "Job Title",
  phone: "Phone",
  email: "Email",
  address: "Address",
  website: "Website",
  linkedin: "LinkedIn",
  aboutMe: "About Me",
};

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
}

const AppStateContext = createContext<AppStateValue | null>(null);

// Shared state that both the sidebar (rendered once in the root layout) and
// the resume editor page need — lifted up here so the sidebar's "Features"
// checklist (sections + personal-info fields) and accent color picker work
// on every page, not just "/".
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string | null>(null);
  const [font, setFont] = useState<FontKey | null>(null);
  const [sectionOrder, setSectionOrder] =
    useState<SectionKey[]>(defaultSectionOrder);
  const [visibleFields, setVisibleFields] = useState<FieldKey[]>(
    defaultVisibleFields,
  );

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
