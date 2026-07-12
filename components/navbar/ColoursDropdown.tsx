"use client";

/**
 * Navbar button for picking the resume's accent color (preset swatches or
 * a custom color) — moved out of the old Sidebar "Features" panel.
 */
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { ColoursIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import { rows } from "@/lib/color";

export default function ColoursDropdown() {
  const { t } = useTranslation();
  const { color, setColor } = useAppState();

  const isPresetColor = rows.some((row) =>
    row.some((swatch) => swatch.value === color),
  );
  const isCustomSelected = color !== null && !isPresetColor;

  return (
    <NavbarDropdownButton
      icon={<ColoursIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.colours")}
      panelClassName="w-auto"
      align="start"
    >
      <div className="flex flex-col gap-2">
        {rows.map((row, rowIndex) => (
          <div key={row[0].name} className="flex gap-2">
            {row.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                aria-label={swatch.name}
                title={swatch.name}
                className={`h-8 w-8 shrink-0 rounded-full border border-black/10 ${
                  color === swatch.value ? "ring-2 ring-offset-1" : ""
                }`}
                style={{
                  backgroundColor: swatch.value,
                  ...(color === swatch.value
                    ? ({
                        "--tw-ring-color": swatch.value,
                      } as React.CSSProperties)
                    : {}),
                }}
                onClick={() => setColor(swatch.value)}
              />
            ))}

            {rowIndex === rows.length - 1 && (
              <span
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-base-200 ${
                  isCustomSelected ? "ring-2 ring-offset-1" : ""
                }`}
                style={
                  isCustomSelected
                    ? ({ "--tw-ring-color": color } as React.CSSProperties)
                    : undefined
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="pointer-events-none h-4 w-4 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                  />
                </svg>
                <input
                  type="color"
                  aria-label={t("sidebar.customColour")}
                  title={t("sidebar.customColour")}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={color ?? "#000000"}
                  onChange={(e) => setColor(e.target.value)}
                />
              </span>
            )}
          </div>
        ))}
      </div>
    </NavbarDropdownButton>
  );
}
