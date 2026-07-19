"use client";

/**
 * Site-wide footer showing the localized copyright line with the current
 * year, plus a link to reopen the cookie consent preferences (the only
 * place a returning visitor can change their earlier decision, since the
 * banner itself only shows once — see components/CookieConsent.tsx).
 */
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { useCookieConsent } from "@/components/CookieConsent";

export default function Footer() {
  const { t } = useTranslation();
  const { openPreferences } = useCookieConsent();
  const year = Temporal.Now.plainDateISO().year;

  return (
    <footer className="border-base-300 bg-base-100 text-base-content/60 flex flex-col items-center gap-2 border-t py-6 text-center text-sm">
      <span>{t("footer.copyright", { year })}</span>
      <button type="button" className="link link-hover" onClick={openPreferences}>
        {t("cookieConsent.preferencesLink")}
      </button>
    </footer>
  );
}
