"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  allFields,
  allSections,
  useAppState,
  type FieldKey,
} from "@/components/AppState";
import { MyResumesIcon, TemplatesIcon } from "@/components/Icons";
import { rows } from "@/lib/color";
import { fontSizeOptions } from "@/lib/fontSize";
import { allFonts, type FontKey } from "@/lib/fonts";
import type { SectionKey } from "@/lib/resumeData";

function FeaturesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  const {
    color,
    setColor,
    font,
    setFont,
    fontSize,
    setFontSize,
    sectionOrder,
    setSectionOrder,
    visibleFields,
    setVisibleFields,
  } = useAppState();

  function toggleSection(key: SectionKey, enabled: boolean) {
    setSectionOrder((prev) =>
      enabled ? [...prev, key] : prev.filter((section) => section !== key),
    );
  }

  function toggleField(key: FieldKey, enabled: boolean) {
    setVisibleFields((prev) =>
      enabled ? [...prev, key] : prev.filter((field) => field !== key),
    );
  }

  const [collapsed, setCollapsed] = useState(false);

  const isPresetColor = rows.some((row) =>
    row.some((swatch) => swatch.value === color),
  );
  const isCustomSelected = color !== null && !isPresetColor;

  return (
    <div className="bg-base-100 border-base-300 flex w-full flex-col border-b lg:h-full lg:w-auto lg:border-r lg:border-b-0">
      {/* Mobile/tablet: icon-only tab bar at the top */}
      <div role="tablist" className="tabs tabs-box m-2 lg:hidden">
        <Link
          href="/templates"
          role="tab"
          className="tab"
          aria-label={t("sidebar.templates")}
          title={t("sidebar.templates")}
        >
          <TemplatesIcon className="h-5 w-5 stroke-current" />
        </Link>
        <Link
          href="/my-resumes"
          role="tab"
          className="tab"
          aria-label={t("sidebar.myResumes")}
          title={t("sidebar.myResumes")}
        >
          <MyResumesIcon className="h-5 w-5 stroke-current" />
        </Link>
        <button
          type="button"
          role="tab"
          className={`tab ${!collapsed ? "tab-active" : ""}`}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={t("sidebar.features")}
          title={t("sidebar.features")}
        >
          <FeaturesIcon className="h-5 w-5 stroke-current" />
        </button>
      </div>

      {/* Desktop: permanent left column with labels + its own collapse toggle */}
      <div
        className={`hidden transition-[width] duration-200 lg:flex lg:flex-col ${
          collapsed ? "lg:w-20" : "lg:w-80"
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`btn btn-primary btn-circle btn-sm fixed top-[calc(50%+2rem)] z-10 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-200 ${
            collapsed ? "left-20" : "left-80"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className={`h-5 w-5 stroke-current transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <ul className="menu w-full flex-nowrap p-4">
          <li>
            <Link
              href="/templates"
              title={collapsed ? t("sidebar.templates") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <TemplatesIcon className="h-7 w-7 stroke-current" />
              {!collapsed && t("sidebar.templates")}
            </Link>
          </li>
          <li>
            <Link
              href="/my-resumes"
              title={collapsed ? t("sidebar.myResumes") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <MyResumesIcon className="h-7 w-7 stroke-current" />
              {!collapsed && t("sidebar.myResumes")}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={t("sidebar.features")}
              title={collapsed ? t("sidebar.features") : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : ""}`}
            >
              <FeaturesIcon className="h-7 w-7 stroke-current" />
              {!collapsed && t("sidebar.features")}
            </button>
          </li>
        </ul>
      </div>

      {!collapsed && (
        <div className="border-base-300 overflow-y-auto border-t p-4 lg:flex-1">
          <p className="mb-2 text-xs font-semibold text-base-content/50 uppercase">
            {t("sidebar.features")}
          </p>
          <div className="flex flex-col gap-2">
            {allFields.map((key) => {
              const enabled = visibleFields.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={enabled}
                    onChange={() => toggleField(key, !enabled)}
                  />
                  {t(`fields.${key}`)}
                </label>
              );
            })}

            {allSections.map((key) => {
              const enabled = sectionOrder.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={enabled}
                    onChange={() => toggleSection(key, !enabled)}
                  />
                  {t(`sections.${key}`)}
                </label>
              );
            })}
          </div>

          <p className="mt-4 mb-2 text-xs font-semibold text-base-content/50 uppercase">
            {t("sidebar.colours")}
          </p>
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
                        ? ({
                            "--tw-ring-color": color,
                          } as React.CSSProperties)
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

          <p className="mt-4 mb-2 text-xs font-semibold text-base-content/50 uppercase">
            {t("sidebar.typography")}
          </p>
          <select
            aria-label={t("sidebar.typography")}
            className="select typography-select w-full"
            value={font ?? allFonts[0].key}
            onChange={(e) => setFont(e.target.value as FontKey)}
          >
            {allFonts.map((option) => (
              <option
                key={option.key}
                value={option.key}
                style={{ fontFamily: option.variable }}
              >
                {option.name}
              </option>
            ))}
          </select>

          <p className="mt-4 mb-2 text-xs font-semibold text-base-content/50 uppercase">
            {t("sidebar.fontSize")}
          </p>
          <div className="flex gap-2">
            {fontSizeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-label={t(`sidebar.fontSizeOptions.${option.key}`)}
                title={t(`sidebar.fontSizeOptions.${option.key}`)}
                onClick={() => setFontSize(option.key)}
                className={`bg-base-200 flex h-11 flex-1 items-center justify-center rounded-md border border-black/10 font-semibold ${
                  fontSize === option.key
                    ? "ring-primary ring-2 ring-offset-1"
                    : ""
                }`}
              >
                <span style={{ fontSize: `${option.px}px`, lineHeight: 1 }}>
                  A
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
