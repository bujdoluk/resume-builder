"use client";

/**
 * Shared "icon + label button that reveals a panel on click" wrapper for
 * the Navbar's editor-only feature buttons (Features/Colours/Typography/
 * Font Size) — mirrors `components/LanguageSelect.tsx`'s dropdown/trigger/
 * panel structure, but deliberately has no close-on-select logic: unlike
 * picking a language (a single terminal action), these panels hold
 * multi-toggle controls (checkboxes, swatch grids) that should stay open
 * across several interactions. daisyUI's `:focus-within` already keeps the
 * dropdown open as long as focus stays inside it.
 */
export default function NavbarDropdownButton({
  icon,
  label,
  panelClassName,
  align = "end",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  panelClassName?: string;
  // "end" (default) right-aligns the panel to the trigger button, which
  // extends it leftward — fine for buttons near the navbar's right side,
  // but a wide panel on a button near the left can overflow off-screen.
  // "start" left-aligns instead, extending rightward.
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  return (
    <div className={`dropdown dropdown-${align}`}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-ghost flex items-center gap-2"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div
        tabIndex={0}
        className={`dropdown-content bg-base-100 rounded-box z-10 mt-2 p-4 shadow ${panelClassName ?? "w-64"}`}
      >
        {children}
      </div>
    </div>
  );
}
