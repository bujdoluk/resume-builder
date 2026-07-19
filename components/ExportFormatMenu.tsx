"use client";

/**
 * Small dropdown for picking which file format `DownloadButton`/
 * `EmailButton` should act on (PDF, Word, or plain text) — a single shared
 * choice governing both actions, rather than each button having its own
 * picker. Modeled directly on `LanguageSelect.tsx`'s hand-rolled daisyUI
 * dropdown (`dropdown` + `dropdown-content menu` + `active` class on the
 * selected item, same Escape-to-blur handling) so it matches the app's
 * existing dropdown convention instead of introducing a new one.
 */
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@/components/Icons";
import type { ExportFormat } from "@/lib/exportFormat";

export interface ExportFormatMenuProps {
  format: ExportFormat;
  onChange: (format: ExportFormat) => void;
  className?: string;
}

const formatLabelKeys: Record<ExportFormat, string> = {
  pdf: "buttons.formatPdf",
  docx: "buttons.formatDocx",
  txt: "buttons.formatTxt",
};

export default function ExportFormatMenu({
  format,
  onChange,
  className,
}: ExportFormatMenuProps) {
  const { t } = useTranslation();

  function select(next: ExportFormat) {
    onChange(next);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div className="dropdown" onKeyDown={handleKeyDown}>
      <div
        tabIndex={0}
        role="button"
        aria-label={t("aria.selectExportFormat")}
        className={`group ${className ?? ""}`}
      >
        <span className="truncate">{t(formatLabelKeys[format])}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 stroke-current transition-transform duration-200 group-focus:rotate-180" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-10 mt-2 w-56 gap-0.5 p-2 shadow"
      >
        <li>
          <button
            type="button"
            className={format === "pdf" ? "active" : undefined}
            onClick={() => select("pdf")}
          >
            {t("buttons.formatPdf")}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={format === "docx" ? "active" : undefined}
            onClick={() => select("docx")}
          >
            {t("buttons.formatDocx")}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={format === "txt" ? "active" : undefined}
            onClick={() => select("txt")}
          >
            {t("buttons.formatTxt")}
          </button>
        </li>
      </ul>
    </div>
  );
}
