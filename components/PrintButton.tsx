"use client";

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
