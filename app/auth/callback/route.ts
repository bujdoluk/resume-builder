/**
 * Landing point for Google OAuth redirects (both a fresh sign-in and an
 * anonymous-to-Google `linkIdentity` flow started from `app/login/page.tsx`
 * — Supabase routes both back through this same `code` exchange): swaps the
 * `code` query param for a session, then sends the browser on to `next`.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("OAuth code exchange failed:", error);
      Sentry.captureException(error);
    } catch (error) {
      // exchangeCodeForSession only returns known auth failures as `error` —
      // anything else (network blip, stale/replayed code verifier) throws,
      // and would otherwise surface as an unhandled 500 here.
      console.error("OAuth code exchange threw:", error);
      Sentry.captureException(error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
