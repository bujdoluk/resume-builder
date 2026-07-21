
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

export async function logIn(
  supabase: SupabaseClient,
  email: string,
  password: string,
  captchaToken?: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
  if (error) throw mapSignInError(error);
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string,
  redirectTo: string,
  captchaToken?: string,
): Promise<boolean> {
  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();

  const { error } = existingSession?.user?.is_anonymous
    ? await supabase.auth.updateUser({ email, password }, { emailRedirectTo: redirectTo })
    : await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo, captchaToken },
      });

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

export async function resetPassword(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
  captchaToken?: string,
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo, captchaToken });
  if (error) throw new AuthActionError("generic", error);
}

export async function updatePassword(supabase: SupabaseClient, password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw mapSignUpError(error);
}

export async function logOut(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut();
}
