/**
 * Opens the Tawk.to chat widget (see components/TawkChat.tsx) — used by the
 * navbar's "Support" menu item (components/navbar/AuthButton.tsx), which
 * falls back to a mailto: link when this returns `false` (chat not
 * consented to yet, or the embed script hasn't finished loading). Returns
 * whether it actually triggered the widget, since `window.Tawk_API` simply
 * doesn't exist until the visitor has opted into support-chat cookies (see
 * components/CookieConsent.tsx) and the script has loaded.
 */
declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

export function openSupportChat(): boolean {
  const maximize = window.Tawk_API?.maximize;
  if (typeof maximize !== "function") return false;
  maximize();
  return true;
}
