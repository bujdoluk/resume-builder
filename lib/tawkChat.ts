
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
