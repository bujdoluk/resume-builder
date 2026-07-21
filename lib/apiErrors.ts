import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import cs from "@/lib/i18n/locales/cs.json";
import de from "@/lib/i18n/locales/de.json";
import en from "@/lib/i18n/locales/en.json";
import es from "@/lib/i18n/locales/es.json";
import fr from "@/lib/i18n/locales/fr.json";
import it from "@/lib/i18n/locales/it.json";
import nb from "@/lib/i18n/locales/nb.json";
import nl from "@/lib/i18n/locales/nl.json";
import pl from "@/lib/i18n/locales/pl.json";
import pt from "@/lib/i18n/locales/pt.json";
import ru from "@/lib/i18n/locales/ru.json";
import sk from "@/lib/i18n/locales/sk.json";
import sv from "@/lib/i18n/locales/sv.json";

const RESOURCES: Record<string, { apiErrors: Record<string, string> }> = {
  en,
  sk,
  cs,
  de,
  pl,
  pt,
  ru,
  es,
  it,
  fr,
  sv,
  nb,
  nl,
};

export type ApiErrorKey = keyof typeof en.apiErrors;

function localeFromRequest(request: Request): string {
  const requested = request.headers.get(API_LOCALE_HEADER);
  return requested && requested in RESOURCES ? requested : "en";
}

export function errorResponse(status: number, key: ApiErrorKey, request: Request): Response {
  const locale = localeFromRequest(request);
  const message = RESOURCES[locale].apiErrors[key] ?? RESOURCES.en.apiErrors[key];
  return Response.json({ error: message }, { status });
}
