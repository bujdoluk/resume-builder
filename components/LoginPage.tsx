"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from "@/components/Icons";
import { AuthActionError, continueWithGoogle, logIn, resetPassword, signUp } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { forgetSessionOnBrowserClose } from "@/lib/supabase/rememberMe";

type Mode = "login" | "signup" | "reset";

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error") === "oauth" ? t("auth.errors.oauth") : null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const hcaptchaRef = useRef<HCaptcha>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setConfirmEmailSent(false);
    setResetLinkSent(false);

    setCaptchaToken(null);
  }

  function resetCaptcha() {
    hcaptchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError(t("auth.captchaRequired"));
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await logIn(supabase, email, password, captchaToken ?? undefined);
        if (!rememberMe) forgetSessionOnBrowserClose();
        router.push(next);
      } else {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const loggedIn = await signUp(supabase, email, password, redirectTo, captchaToken ?? undefined);
        if (loggedIn) {
          router.push(next);
        } else {
          setConfirmEmailSent(true);
        }
      }
    } catch (thrown) {
      const code = thrown instanceof AuthActionError ? thrown.code : "generic";
      setError(t(`auth.errors.${code}`));
    } finally {
      setSubmitting(false);
      resetCaptcha();
    }
  }

  async function handleResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError(t("auth.captchaRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      await resetPassword(supabase, email, redirectTo, captchaToken ?? undefined);
      setResetLinkSent(true);
    } catch (thrown) {
      const code = thrown instanceof AuthActionError ? thrown.code : "generic";
      setError(t(`auth.errors.${code}`));
    } finally {
      setSubmitting(false);
      resetCaptcha();
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      await continueWithGoogle(supabase, redirectTo);
    } catch {
      setError(t("auth.errors.oauth"));
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
      <div className="card bg-base-100 border-base-300 w-full max-w-sm border shadow-sm">
        <div className="card-body">
          <h1 className="text-center text-xl font-bold">
            {mode === "login" && t("auth.loginTitle")}
            {mode === "signup" && t("auth.signupTitle")}
            {mode === "reset" && t("auth.resetTitle")}
          </h1>
          <p className="text-base-content/70 text-sm">
            {mode === "login" && t("auth.loginSubtitle")}
            {mode === "signup" && t("auth.signupSubtitle")}
            {mode === "reset" && t("auth.resetSubtitle")}
          </p>

          {mode === "reset" ? (
            resetLinkSent ? (
              <div className="alert alert-success mt-4">
                <span>{t("auth.resetLinkSent")}</span>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="mt-4 flex flex-col gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">{t("auth.emailLabel")}</legend>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </fieldset>

                {HCAPTCHA_SITE_KEY && (
                  <HCaptcha
                    ref={hcaptchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                  />
                )}

                {error && <p className="text-error text-sm">{error}</p>}

                <button type="submit" className="btn btn-primary mt-1" disabled={submitting}>
                  {submitting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    t("auth.resetSubmit")
                  )}
                </button>
              </form>
            )
          ) : confirmEmailSent ? (
            <div className="alert alert-success mt-4">
              <span>{t("auth.confirmEmailSent")}</span>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">{t("auth.emailLabel")}</legend>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">{t("auth.passwordLabel")}</legend>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input input-bordered w-full pr-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={mode === "signup" ? 6 : undefined}
                      required
                    />
                    <button
                      type="button"
                      className="text-base-content/50 hover:text-base-content absolute inset-y-0 right-2 flex items-center"
                      aria-label={showPassword ? t("aria.hidePassword") : t("aria.showPassword")}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4 stroke-current" />
                      ) : (
                        <EyeIcon className="h-4 w-4 stroke-current" />
                      )}
                    </button>
                  </div>
                </fieldset>

                {mode === "login" && (
                  <div className="-mt-2 flex items-center justify-between">
                    <label className="label cursor-pointer gap-2 p-0 text-xs">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      {t("auth.rememberMe")}
                    </label>
                    <button
                      type="button"
                      className="link link-hover text-base-content/60 text-xs"
                      onClick={() => switchMode("reset")}
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                )}

                {HCAPTCHA_SITE_KEY && (
                  <HCaptcha
                    ref={hcaptchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                  />
                )}

                {error && <p className="text-error text-sm">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary mt-1"
                  disabled={submitting || googleSubmitting}
                >
                  {submitting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : mode === "login" ? (
                    t("auth.loginSubmit")
                  ) : (
                    t("auth.signupSubmit")
                  )}
                </button>
              </form>

              <div className="divider text-base-content/50 text-xs">
                {t("auth.orDivider")}
              </div>

              <button
                type="button"
                className="btn btn-outline"
                disabled={googleSubmitting || submitting}
                onClick={handleGoogle}
              >
                {googleSubmitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                {t("auth.googleContinue")}
              </button>

              {mode === "signup" && (
                <p className="text-base-content/60 mt-3 text-center text-xs">
                  <Trans
                    i18nKey="auth.signupAgreement"
                    components={{
                      termsLink: <Link href="/terms" className="link" />,
                      privacyLink: <Link href="/privacy" className="link" />,
                    }}
                  />
                </p>
              )}
            </>
          )}

          <p className="mt-4 text-center text-sm">
            {mode === "reset" ? (
              <button
                type="button"
                className="link link-primary font-medium"
                onClick={() => switchMode("login")}
              >
                {t("auth.backToLogin")}
              </button>
            ) : (
              <Trans
                i18nKey={mode === "login" ? "auth.switchToSignup" : "auth.switchToLogin"}
                components={{
                  switchLink: (
                    <button
                      type="button"
                      className="link link-primary font-medium"
                      onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                    />
                  ),
                }}
              />
            )}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="link link-hover text-base-content/60 mt-2 flex items-center justify-center gap-1 text-center text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4 stroke-current" />
            {t("account.goBack")}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.997 11.997 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.997 11.997 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
