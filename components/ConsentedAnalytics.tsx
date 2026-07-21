"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/components/CookieConsent";

export default function ConsentedAnalytics() {
  const { consent } = useCookieConsent();
  if (!consent.analytics) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
