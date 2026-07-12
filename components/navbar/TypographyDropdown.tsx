"use client";

/**
 * Navbar button for picking the resume's font — moved out of the old
 * Sidebar "Features" panel. Renders every font as its own button in a grid
 * (all visible at once, no scrolling — matching Font Size's row-of-buttons
 * pattern), each styled in its actual font, rather than a native `<select>`:
 * browsers largely ignore inline `font-family` styling on `<option>`
 * elements, so the old select never really showed a live preview.
 */
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { TypographyIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { allFonts } from "@/lib/fonts";

export default function TypographyDropdown() {
  const { t } = useTranslation();
  const { font, setFont } = useAppState();
  const selectedFont = font ?? allFonts[0].key;

  return (
    <NavbarDropdownButton
      icon={<TypographyIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.typography")}
      panelClassName="w-80"
      align="start"
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
