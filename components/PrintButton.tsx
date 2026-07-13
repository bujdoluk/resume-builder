"use client";

/**
 * Print button: opens the Preview modal (if not already open) and triggers
 * the browser's native print dialog via `window.print()` — the actual
 * "print only the resume" behavior is the `#pdf-area` rule in
 * app/globals.css's `@media print` block, paired with
 * `PreviewModal`'s `print()` ref method.
 */
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { PrintIcon } from "@/components/Icons";
import type { PreviewModalHandle } from "@/components/PreviewModal";

export default function PrintButton({
  previewRef,
  className,
}: {
  previewRef: RefObject<PreviewModalHandle | null>;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={className}
      onClick={() => previewRef.current?.print()}
    >
      <PrintIcon className="h-5 w-5 stroke-current" />
      {t("buttons.print")}
    </button>
  );
}
