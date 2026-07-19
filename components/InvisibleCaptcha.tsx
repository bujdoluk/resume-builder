"use client";

/**
 * A single, invisible (no checkbox UI) hCaptcha widget mounted once in the
 * root layout, used only to get a captchaToken for the *silent* anonymous
 * sign-in `ensureUserId` performs (lib/supabase/session.ts) — separate from
 * the visible checkbox widget on `/login` (components/LoginPage.tsx), which
 * stays as-is. `size="invisible"` means `.execute()` verifies in the
 * background for the vast majority of visitors with no visible challenge at
 * all; hCaptcha only pops one up for traffic its risk scoring actually
 * flags. Renders nothing (and registers no executor) if
 * NEXT_PUBLIC_HCAPTCHA_SITE_KEY isn't set, matching every other hCaptcha/
 * Tawk.to integration in this app — local dev works before it's configured,
 * and until Supabase's CAPTCHA protection is turned on, signInAnonymously
 * doesn't need a token anyway.
 */
import { useEffect, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { registerCaptchaExecutor } from "@/lib/supabase/invisibleCaptcha";

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
const READY_POLL_INTERVAL_MS = 100;
const READY_POLL_ATTEMPTS = 20;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function InvisibleCaptcha() {
  const widgetRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;

    async function getToken(): Promise<string | undefined> {
      const widget = widgetRef.current;
      if (!widget) return undefined;

      // The hCaptcha script loads asynchronously — on a fresh page load,
      // ensureUserId can run before it's ready. Poll briefly (up to ~2s)
      // rather than failing immediately, since this only ever runs once
      // per anonymous session, not on a hot path.
      for (let attempt = 0; attempt < READY_POLL_ATTEMPTS && !widget.isReady(); attempt++) {
        await delay(READY_POLL_INTERVAL_MS);
      }
      if (!widget.isReady()) return undefined;

      try {
        const result = await widget.execute({ async: true });
        return result?.response;
      } catch {
        return undefined;
      }
    }

    registerCaptchaExecutor(getToken);
    return () => registerCaptchaExecutor(null);
  }, []);

  if (!HCAPTCHA_SITE_KEY) return null;

  return <HCaptcha ref={widgetRef} sitekey={HCAPTCHA_SITE_KEY} size="invisible" />;
}
