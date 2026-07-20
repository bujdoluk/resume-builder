/**
 * Opens the Tawk.to chat widget (see components/TawkChat.tsx) — used by the
 * navbar's "Support" menu item (components/navbar/AuthButton.tsx). Tawk's
 * own embed script sets `window.Tawk_API` and queues calls made before the
 * widget has fully finished loading, so calling `.maximize()` as soon as
 * it exists is safe even moments after the script first injects.
 */
declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

export function openSupportChat() {
  window.Tawk_API?.maximize?.();
}
