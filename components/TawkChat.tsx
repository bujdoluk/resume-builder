"use client";

/**
 * Embeds the Tawk.to live chat widget site-wide (mounted once in the root
 * layout, alongside Analytics/SpeedInsights). Uses `next/script`'s default
 * `afterInteractive` strategy so it loads without blocking the initial
 * page render. Renders nothing if the property/widget id env vars aren't
 * set (so local dev works without a Tawk.to account) or until the
 * "supportChat" cookie consent category is accepted (see
 * components/CookieConsent.tsx) — this sets third-party cookies, so it
 * can't load before then.
 */
import Script from "next/script";
import { useCookieConsent } from "@/components/CookieConsent";

export default function TawkChat() {
  const { consent } = useCookieConsent();
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;
  if (!propertyId || !widgetId || !consent.supportChat) return null;

  return (
    <Script id="tawk-to" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();
        (function () {
          var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = "https://embed.tawk.to/${propertyId}/${widgetId}";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
