
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import type { TotpEnrollment, TotpFactor } from "@/types/auth";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailInUse"
  | "weakPassword"
  | "oauth"
  | "generic"
  | "mfaInvalidCode"
  | "mfaNotEnabled";

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

function mapMfaError(error: AuthError): AuthActionError {
  if (error.code === "mfa_verification_failed" || error.code === "mfa_verification_rejected") {
    return new AuthActionError("mfaInvalidCode", error);
  }
  if (error.code === "mfa_totp_enroll_not_enabled" || error.code === "mfa_totp_verify_not_enabled") {
    return new AuthActionError("mfaNotEnabled", error);
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

// True once a password sign-in has established an aal1 session but the user
// has a verified TOTP factor — i.e. LoginPage must prompt for the 6-digit
// code before the session actually reaches aal2.
export async function getStepUpRequired(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

export async function verifyStepUpChallenge(supabase: SupabaseClient, code: string): Promise<void> {
  const factor = await getTotpFactor(supabase);
  if (!factor) throw new AuthActionError("mfaNotEnabled");

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) throw mapMfaError(error);
}

export async function enrollTotp(supabase: SupabaseClient, issuer: string): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer });
  if (error) throw mapMfaError(error);
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmTotpEnrollment(
  supabase: SupabaseClient,
  factorId: string,
  code: string,
): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw mapMfaError(error);
}

// Only ever returns a *verified* factor — Supabase's listFactors() already
// filters its `totp` array to verified entries, so an abandoned/unconfirmed
// enrollment never shows up here as "enabled".
export async function getTotpFactor(supabase: SupabaseClient): Promise<TotpFactor | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw mapMfaError(error);
  const factor = data.totp[0];
  return factor ? { id: factor.id, createdAt: factor.created_at } : null;
}

export async function unenrollTotp(supabase: SupabaseClient, factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw mapMfaError(error);
}
