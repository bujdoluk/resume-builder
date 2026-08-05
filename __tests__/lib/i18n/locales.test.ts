import { describe, expect, it } from "vitest";
import cs from "@/lib/i18n/locales/cs.json";
import de from "@/lib/i18n/locales/de.json";
import en from "@/lib/i18n/locales/en.json";
import es from "@/lib/i18n/locales/es.json";
import fr from "@/lib/i18n/locales/fr.json";
import itLocale from "@/lib/i18n/locales/it.json";
import nb from "@/lib/i18n/locales/nb.json";
import nl from "@/lib/i18n/locales/nl.json";
import pl from "@/lib/i18n/locales/pl.json";
import pt from "@/lib/i18n/locales/pt.json";
import ru from "@/lib/i18n/locales/ru.json";
import sk from "@/lib/i18n/locales/sk.json";
import sv from "@/lib/i18n/locales/sv.json";

const locales: Record<string, unknown> = { cs, de, es, fr, it: itLocale, nb, nl, pl, pt, ru, sk, sv };

// Arrays (e.g. pricing.featureRows) are treated as a single leaf — their
// *content* is translated per-locale, but the key structure around them
// isn't expected to fan out per array index.
function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [prefix];
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectKeyPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

const enKeys = new Set(collectKeyPaths(en));

describe("i18n locale parity", () => {
  it("found translation keys to compare against (sanity check on the collector itself)", () => {
    expect(enKeys.size).toBeGreaterThan(100);
  });

  it.each(Object.entries(locales))(
    "%s.json has exactly the same keys as en.json",
    (_locale, resource) => {
      const localeKeys = new Set(collectKeyPaths(resource));

      const missing = [...enKeys].filter((key) => !localeKeys.has(key)).sort();
      const extra = [...localeKeys].filter((key) => !enKeys.has(key)).sort();

      expect(missing, `missing keys: ${missing.join(", ")}`).toEqual([]);
      expect(extra, `unexpected extra keys: ${extra.join(", ")}`).toEqual([]);
    },
  );
});
