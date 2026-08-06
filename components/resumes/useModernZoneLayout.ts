"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { FieldKey } from "@/lib/fields";
import {
  resolveModernSectionZone,
  splitSectionsByZone,
  type ModernSectionZones,
  type SectionKey,
} from "@/lib/resumeData";

export function useModernZoneLayout({
  sectionOrder,
  onReorderSections,
  modernSectionZones,
  setModernSectionZones,
  visibleFields,
}: {
  sectionOrder: SectionKey[];
  onReorderSections: (order: SectionKey[]) => void;
  modernSectionZones: ModernSectionZones;
  setModernSectionZones: Dispatch<SetStateAction<ModernSectionZones>>;
  visibleFields: FieldKey[];
}) {

  const [aboutMeIndex, setAboutMeIndex] = useState(0);

  const { sidebar: sidebarSectionKeys, main: mainSectionKeys } = splitSectionsByZone(
    sectionOrder,
    modernSectionZones,
  );

  const aboutMeVisible = visibleFields.includes("aboutMe");
  const aboutMeZone = resolveModernSectionZone("aboutMe", modernSectionZones);

  function withAboutMe(
    keys: SectionKey[],
    isAboutMeZone: boolean,
  ): (SectionKey | "aboutMe")[] {
    if (!aboutMeVisible || !isAboutMeZone) return keys;
    const index = Math.min(aboutMeIndex, keys.length);
    return [...keys.slice(0, index), "aboutMe", ...keys.slice(index)];
  }

  const sidebarItems = withAboutMe(sidebarSectionKeys, aboutMeZone === "sidebar");
  const mainItems = withAboutMe(mainSectionKeys, aboutMeZone === "main");

  function onZonesChange(next: {
    sidebar: (SectionKey | "aboutMe")[];
    main: (SectionKey | "aboutMe")[];
  }) {
    const newAboutMeZone: "sidebar" | "main" = next.sidebar.includes("aboutMe")
      ? "sidebar"
      : "main";
    const newAboutMeIndex = (
      newAboutMeZone === "sidebar" ? next.sidebar : next.main
    ).indexOf("aboutMe");
    if (newAboutMeIndex !== -1) setAboutMeIndex(newAboutMeIndex);

    const newSidebarKeys = next.sidebar.filter(
      (item): item is SectionKey => item !== "aboutMe",
    );
    const newMainSectionKeys = next.main.filter(
      (item): item is SectionKey => item !== "aboutMe",
    );
    onReorderSections([...newSidebarKeys, ...newMainSectionKeys]);

    setModernSectionZones((prev) => ({
      ...prev,
      ...Object.fromEntries(newSidebarKeys.map((key) => [key, "sidebar" as const])),
      ...Object.fromEntries(newMainSectionKeys.map((key) => [key, "main" as const])),
      ...(aboutMeVisible ? { aboutMe: newAboutMeZone } : {}),
    }));
  }

  return { sidebarItems, mainItems, onZonesChange };
}
