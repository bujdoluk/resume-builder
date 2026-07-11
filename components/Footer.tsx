"use client";

import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

export default function Footer() {
  const { t } = useTranslation();
  const year = Temporal.Now.plainDateISO().year;

  return (
    <footer className="border-base-300 bg-base-100 text-base-content/60 border-t py-6 text-center text-sm">
      {t("footer.copyright", { year })}
    </footer>
  );
}
