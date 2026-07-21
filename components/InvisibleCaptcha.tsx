"use client";

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
