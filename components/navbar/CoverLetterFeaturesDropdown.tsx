"use client";

/**
 * Navbar button for toggling which cover letter fields are visible — the
 * cover letter counterpart of `FeaturesDropdown.tsx`. Toggling a field off
 * removes it from `coverLetterFieldOrder`; toggling it back on appends it
 * at the end, same convention as the resume's `visibleFields`.
 */
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { FeaturesIcon } from "@/components/Icons";
import { allCoverLetterFields, type CoverLetterFieldKey } from "@/lib/coverLetterFields";
import NavbarDropdownButton from "@/components/navbar/NavbarDropdownButton";

export default function CoverLetterFeaturesDropdown() {
  const { t } = useTranslation();
  const { coverLetterFieldOrder, setCoverLetterFieldOrder } = useAppState();

  function toggleField(key: CoverLetterFieldKey, enabled: boolean) {
    setCoverLetterFieldOrder((prev) =>
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
        {allCoverLetterFields.map((key) => {
          const enabled = coverLetterFieldOrder.includes(key);
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
              {t(`coverLetter.${key}`)}
            </label>
          );
        })}
      </div>
    </NavbarDropdownButton>
  );
}
