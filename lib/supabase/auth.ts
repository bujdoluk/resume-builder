/**
 * Email/password + Google login and signup, on top of the silent anonymous
 * session `ensureUserId` creates. `signUp`/`continueWithGoogle` both take an
 * explicit `redirectTo` (the caller's own origin) rather than relying on
 * Supabase's dashboard-configured Site URL default — otherwise confirmation
 * emails/OAuth redirects sent from production would point at whatever Site
 * URL happens to be set in the dashboard (e.g. still `localhost:3000` from
 * initial local dev), which is broken for every real visitor.
 *
 * Email/password signup converts the
 * current anonymous user in place (via `updateUser`) when there is one, so
 * resumes/cover letters already saved under the anonymous id stay attached
 * — and if that email already belongs to an existing account, `updateUser`
 * fails with a clear "already in use" error the caller can show.
 *
 * Google deliberately does *not* do that anonymous-linking dance
 * (`linkIdentity`): that call fails outright if the Google identity is
 * already linked to a different user, which is exactly what happens for
 * any returning user on a fresh anonymous session (new device, cleared
 * cookies, etc.) — a far more common case than a brand-new user's first
 * ever Google signup. So Google always just signs in/up normally; the
 * trade-off is anonymous data isn't auto-carried into a first-time Google
 * account the way it is for email/password.
 *
 * Logging into an *existing* separate account (either method) is a
 * genuinely different user id from the anonymous session — its data can't
 * carry over, since Supabase has no server-side merge for that and this
 * project has no service-role key to do it manually.
 */
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailInUse"
  | "weakPassword"
  | "oauth"
  | "generic";

export class AuthActionError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, cause?: AuthError | Error) {
    super(cause?.message ?? code);
    this.code = code;
  }
}

function mapSignInError(error: AuthError): AuthActionError {
  if (error.code === "invalid_credentials") {
    return new AuthActionError("invalidCredentials", error);
  }
  return new AuthActionError("generic", error);
}

function mapSignUpError(error: AuthError): AuthActionError {
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return new AuthActionError("emailInUse", error);
  }
  if (error.code === "weak_password") {
    return new AuthActionError("weakPassword", error);
  }
  return new AuthActionError("generic", error);
}

export async function logIn(supabase: SupabaseClient, email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw mapSignInError(error);
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string,
  redirectTo: string,
): Promise<boolean> {
  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();

  const { error } = existingSession?.user?.is_anonymous
    ? await supabase.auth.updateUser({ email, password }, { emailRedirectTo: redirectTo })
    : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });

  if (error) throw mapSignUpError(error);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session?.user && !session.user.is_anonymous;
}

export async function continueWithGoogle(supabase: SupabaseClient, redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) throw new AuthActionError("oauth", error);
}

export async function logOut(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut();
}
