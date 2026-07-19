"use client";

/**
 * Renders Vercel Analytics/Speed Insights only once the "analytics" cookie
 * consent category has been accepted (see components/CookieConsent.tsx) —
 * replaces mounting <Analytics />/<SpeedInsights /> unconditionally in
 * app/layout.tsx.
 */
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
