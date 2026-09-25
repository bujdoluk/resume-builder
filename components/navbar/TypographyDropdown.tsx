"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { TypographyIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { allFonts, defaultFontKey } from "@/lib/fonts";

export default function TypographyDropdown() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { font, setFont, templateId, coverLetterTemplateId } = useAppState();
  const selectedFont = font ?? defaultFontKey;

  // Harvard's style is locked — see ColoursDropdown.tsx for why this checks
  // both templateId and coverLetterTemplateId.
  const isHarvardActive =
    pathname === "/app" ? templateId === "harvard" : coverLetterTemplateId === "harvard";

  return (
    <NavbarDropdownButton
      icon={<TypographyIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.typography")}
      panelClassName="w-80"
      align="start"
      disabled={isHarvardActive}
      disabledTitle={t("sidebar.harvardLockedTooltip")}
    >
      <div className="grid grid-cols-2 gap-2">
        {allFonts.map((option) => {
          const isSelected = option.key === selectedFont;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setFont(option.key)}
              className={`rounded-md border border-black/10 px-3 py-2 text-left text-sm ${
                isSelected ? "ring-primary ring-2 ring-offset-1" : ""
              }`}
              style={{ fontFamily: option.variable }}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </NavbarDropdownButton>
  );
}
