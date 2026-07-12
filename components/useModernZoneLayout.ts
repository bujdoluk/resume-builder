"use client";

/**
 * Shared Modern-template zone bookkeeping used identically by the desktop
 * canvas (`Resume.tsx`) and the mobile form (`ModernMobileForm.tsx`): splits
 * `sectionOrder` into sidebar/main key lists via `splitSectionsByZone`,
 * interleaves the synthetic "aboutMe" pseudo-section into whichever zone it
 * currently occupies (it's freely draggable between zones too, not just
 * within one), and reconciles a `SortableZones` drag result back into
 * `sectionOrder` and the persisted zone map.
 */
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
  // Position of "About Me" within whichever zone it currently occupies — an
  // index rather than a full merged order, so it stays correct as sections
  // are toggled on/off without extra bookkeeping.
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

  // Both zone arrays are typed loosely (matching SortableZones' single
  // shared item type across zones) because "aboutMe" can now legitimately
  // land in either.
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

    // Merge (don't replace) so a section — or "aboutMe" itself, when it's
    // currently hidden and thus absent from this drag entirely — keeps its
    // remembered zone for whenever it's re-enabled via the Sidebar's
    // "Features" checklist, instead of silently snapping back to "main".
    setModernSectionZones((prev) => ({
      ...prev,
      ...Object.fromEntries(newSidebarKeys.map((key) => [key, "sidebar" as const])),
      ...Object.fromEntries(newMainSectionKeys.map((key) => [key, "main" as const])),
      ...(aboutMeVisible ? { aboutMe: newAboutMeZone } : {}),
    }));
  }

  return { sidebarItems, mainItems, onZonesChange };
}
