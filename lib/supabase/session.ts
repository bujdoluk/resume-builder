
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

let inFlightSignIn: Promise<string> | null = null;

const CAPTCHA_RETRY_DELAY_MS = 750;

function isCaptchaFailure(error: AuthError | null): boolean {
  return error?.code === "captcha_failed";
}

async function attemptAnonymousSignIn(supabase: SupabaseClient) {
  const captchaToken = await getAnonymousCaptchaToken();
  return supabase.auth.signInAnonymously({ options: { captchaToken } });
}

export async function ensureUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  if (!inFlightSignIn) {
    inFlightSignIn = (async () => {
      try {
        let { data, error } = await attemptAnonymousSignIn(supabase);

        if (isCaptchaFailure(error)) {
          await new Promise((resolve) => setTimeout(resolve, CAPTCHA_RETRY_DELAY_MS));
          ({ data, error } = await attemptAnonymousSignIn(supabase));
        }

        if (error || !data.user) {
          throw error ?? new Error("Failed to start anonymous session");
        }
        return data.user.id;
      } finally {
        inFlightSignIn = null;
      }
    })();
  }
  return inFlightSignIn;
}
