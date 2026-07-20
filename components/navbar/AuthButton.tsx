"use client";

/**
 * Navbar auth control: a "Log in" link when the visitor is only signed in
 * anonymously (or not at all), or an email + logout dropdown once they hold
 * a real Supabase account. Subscribes to `onAuthStateChange` so it updates
 * immediately after the login page or a Google redirect completes, without
 * needing a full page reload. Logging out sends the visitor back to the
 * landing page.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, LoginIcon } from "@/components/Icons";
import { logOut } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user && !session.user.is_anonymous ? session.user.email ?? "" : null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user && !session.user.is_anonymous ? session.user.email ?? "" : null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    (document.activeElement as HTMLElement | null)?.blur();
  }

  async function handleLogOut() {
    (document.activeElement as HTMLElement | null)?.blur();
    await logOut(supabase);
    router.push("/");
  }

  if (!email) {
    return (
      <Link href="/login" className="link link-hover flex items-center gap-1">
        <LoginIcon className="h-4 w-4 stroke-current" />
        {t("auth.navLogin")}
      </Link>
    );
  }

  return (
    <div className="dropdown dropdown-end" onKeyDown={handleKeyDown}>
      <div
        tabIndex={0}
        role="button"
        aria-label={t("aria.accountMenu")}
        className="group btn btn-sm btn-ghost flex items-center gap-2"
      >
        <span className="whitespace-nowrap">{email}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 stroke-current transition-transform duration-200 group-focus:rotate-180" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-10 mt-2 w-48 gap-0.5 p-2 shadow"
      >
        <li>
          <Link href="/account" onClick={() => (document.activeElement as HTMLElement | null)?.blur()}>
            {t("account.myAccount")}
          </Link>
        </li>
        <li>
          <Link href="/billing" onClick={() => (document.activeElement as HTMLElement | null)?.blur()}>
            {t("account.billing")}
          </Link>
        </li>
        <li>
          <button type="button" onClick={handleLogOut}>
            {t("auth.navLogout")}
          </button>
        </li>
      </ul>
    </div>
  );
}
