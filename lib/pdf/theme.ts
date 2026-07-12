/**
 * Exact daisyUI "light" theme values — the resume canvas is pinned to
 * light-theme colors regardless of the app's own dark/light toggle (see the
 * `.resume-scalable` note in app/globals.css), so these are what the
 * on-screen templates actually fall back to wherever they *don't* apply the
 * user's custom accent color (e.g. Minimal's job title and entry
 * side-borders, which stay daisyUI-purple even when a custom color is
 * picked — see each on-screen template for exactly which elements do and
 * don't respond to `color`). Converted from oklch to sRGB hex via a real
 * browser canvas (not eyeballed), so the PDF export matches pixel-for-pixel
 * instead of approximating with a similar-looking color.
 */
export const DAISYUI_PRIMARY = "#422ad5";
// --color-primary at 40% opacity over white paper (border-primary/40)
export const DAISYUI_PRIMARY_40 = "#b3aaee";
export const DAISYUI_NEUTRAL = "#09090b";
export const DAISYUI_NEUTRAL_CONTENT = "#e4e4e7";
export const DAISYUI_BASE_CONTENT = "#18181b";
// --color-base-300 — the timeline connecting line and timeline-box border.
export const DAISYUI_BASE_300 = "#eeeeee";

// The resume canvas always renders as white paper with dark text, regardless
// of the app's own theme — see the .resume-scalable rule in app/globals.css,
// which pins this exact value as the base text color.
export const RESUME_TEXT_COLOR = "#171717";

// Tailwind v4's gray-500/600/700 — oklch-based, so these differ slightly
// from the classic v3 hex values (#6b7280/#4b5563/#374151).
export const GRAY_500 = "#6a7282";
export const GRAY_600 = "#4a5565";
export const GRAY_700 = "#364153";
