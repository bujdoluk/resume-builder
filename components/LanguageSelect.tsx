"use client";

import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { ChevronDownIcon } from "@/components/Icons";
import { languages } from "@/lib/i18n/languages";

export default function LanguageSelect() {
  const { language, setLanguage } = useAppState();
  const { t } = useTranslation();

  const current = languages.find((option) => option.code === language) ?? languages[0];
  const CurrentFlag = current.flag;

  function selectLanguage(code: string) {
    setLanguage(code);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div className="dropdown dropdown-end" onKeyDown={handleKeyDown}>
      <div
        tabIndex={0}
        role="button"
        aria-label={t("aria.selectLanguage")}
        className="group btn btn-sm btn-ghost flex items-center gap-2"
      >
        <CurrentFlag className="h-4 w-6 shrink-0 rounded-sm" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 stroke-current transition-transform duration-200 group-focus:rotate-180" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-10 mt-2 w-56 gap-0.5 p-2 shadow"
      >
        {languages.map((option) => {
          const Flag = option.flag;
          return (
            <li key={option.code}>
              <button
                type="button"
                className={
                  option.code === language ? "active" : undefined
                }
                onClick={() => selectLanguage(option.code)}
              >
                <Flag className="h-4 w-6 shrink-0 rounded-sm" />
                {option.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
