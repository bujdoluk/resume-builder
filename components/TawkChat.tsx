"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/components/CookieConsent";

export default function TawkChat() {
  const { consent } = useCookieConsent();
  const pathname = usePathname();
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;
  // Skip on public share pages — visitors there have no support relationship
  // with the app, and Tawk.to's own vendor bundle has a pre-existing
  // "Illegal invocation" crash (document.createEvent) on some mobile
  // browsers that isn't fixable from our side; simplest to just not load it
  // on a page family where it doesn't belong anyway.
  const isSharedPage = pathname?.startsWith("/shared/");
  if (!propertyId || !widgetId || !consent.supportChat || isSharedPage) return null;

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
