"use client";

/**
 * `/reset-password` route content: the landing point after a visitor clicks
 * the link from `resetPassword` (lib/supabase/auth.ts). By the time this
 * renders, app/auth/callback/route.ts has already exchanged the email
 * link's code for a session, so this page only needs to collect a new
 * password and call `updatePassword` on that already-authenticated
 * session — there's no separate "verify this is really you" step here.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeSlashIcon } from "@/components/Icons";
import { AuthActionError, updatePassword } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(supabase, password);
      router.push("/app");
    } catch (thrown) {
      const code = thrown instanceof AuthActionError ? thrown.code : "generic";
      setError(t(`auth.errors.${code}`));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-base-200 flex flex-1 items-center justify-center p-6">
      <div className="card bg-base-100 border-base-300 w-full max-w-sm border shadow-sm">
        <div className="card-body">
          <h1 className="text-center text-xl font-bold">{t("auth.newPasswordTitle")}</h1>
          <p className="text-base-content/70 text-sm">{t("auth.newPasswordSubtitle")}</p>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("auth.newPasswordLabel")}</legend>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
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

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("auth.confirmPasswordLabel")}</legend>
              <input
                type={showPassword ? "text" : "password"}
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </fieldset>

            {error && <p className="text-error text-sm">{error}</p>}

            <button type="submit" className="btn btn-primary mt-1" disabled={submitting}>
              {submitting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                t("auth.newPasswordSubmit")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
