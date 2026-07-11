"use client";

import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-base-300 bg-base-200 text-base-content/60 border-t py-6 text-center text-sm">
      {t("footer.copyright", { year })}
    </footer>
  );
}
