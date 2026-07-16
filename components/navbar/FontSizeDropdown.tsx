"use client";

/**
 * Navbar button for picking the resume's font size — moved out of the old
 * Sidebar "Features" panel. Its trigger reuses the same scaled "A" glyph
 * as the panel's own buttons instead of a separate SVG icon.
 */
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { fontSizeOptions } from "@/lib/fontSize";

export default function FontSizeDropdown() {
  const { t } = useTranslation();
  const { fontSize, setFontSize } = useAppState();

  return (
    <NavbarDropdownButton
      icon={<span className="text-base font-semibold">A</span>}
      label={t("sidebar.fontSize")}
      panelClassName="w-80"
      align="start"
    >
      <div className="flex gap-2">
        {fontSizeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-label={t(`sidebar.fontSizeOptions.${option.key}`)}
            title={t(`sidebar.fontSizeOptions.${option.key}`)}
            onClick={() => setFontSize(option.key)}
            className={`bg-base-200 flex h-12 flex-1 items-center justify-center rounded-md border border-black/10 font-semibold ${
              fontSize === option.key ? "ring-primary ring-2 ring-offset-1" : ""
            }`}
          >
            <span style={{ fontSize: `${option.px}px`, lineHeight: 1 }}>A</span>
          </button>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
