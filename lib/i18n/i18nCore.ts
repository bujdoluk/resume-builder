
import i18next from "i18next";
import cs from "./locales/cs.json";
import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import nb from "./locales/nb.json";
import nl from "./locales/nl.json";
import pl from "./locales/pl.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import sk from "./locales/sk.json";
import sv from "./locales/sv.json";
import { defaultLanguageCode } from "./languages";

const resources = {
  en: { translation: en },
  sk: { translation: sk },
  cs: { translation: cs },
  de: { translation: de },
  pl: { translation: pl },
  pt: { translation: pt },
  ru: { translation: ru },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
  sv: { translation: sv },
  nb: { translation: nb },
  nl: { translation: nl },
};

// A separate i18next instance from lib/i18n/i18n.ts, deliberately without
// the initReactI18next plugin — that plugin touches React.createContext at
// import time, which breaks anything reachable from a Route Handler (Next
// bundles those through its RSC-vendored React, which lacks createContext;
// externalizing react-i18next via serverExternalPackages instead creates a
// worse dual-package-instance bug across the rest of the app, since
// useTranslation() is used pervasively in real Client Components).
//
// Used only by the PDF templates (components/pdf/*PdfTemplate.tsx), which
// call .t() imperatively and never need React context / re-render-on-change
// — they're reachable both from client-side downloads (DownloadButton.tsx)
// and from the public share PDF routes (app/shared/**/pdf/route.tsx),
// the latter having no concept of a "current" language at all.
// AppState.tsx keeps this instance's active language in sync with the main
// one for the client-side download path.
const i18nCore = i18next.createInstance();
if (!i18nCore.isInitialized) {
  i18nCore.init({
    resources,
    lng: defaultLanguageCode,
    fallbackLng: defaultLanguageCode,
    interpolation: { escapeValue: false },
  });
}

export default i18nCore;
