"use client";

/**
 * Navbar button for toggling which personal-info fields and resume
 * sections are visible — moved out of the old Sidebar "Features" panel.
 */
import { useTranslation } from "react-i18next";
import {
  allFields,
  allSections,
  useAppState,
  type FieldKey,
} from "@/components/AppState";
import { FeaturesIcon } from "@/components/Icons";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";
import type { SectionKey } from "@/lib/resumeData";

export default function FeaturesDropdown() {
  const { t } = useTranslation();
  const { sectionOrder, setSectionOrder, visibleFields, setVisibleFields } =
    useAppState();

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

  return (
    <NavbarDropdownButton
      icon={<FeaturesIcon className="h-5 w-5 stroke-current" />}
      label={t("sidebar.features")}
      align="start"
    >
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
    </NavbarDropdownButton>
  );
}
