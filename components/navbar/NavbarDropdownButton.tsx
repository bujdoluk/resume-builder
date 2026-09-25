"use client";

function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Escape") return;
  (document.activeElement as HTMLElement | null)?.blur();
}

export default function NavbarDropdownButton({
  icon,
  label,
  panelClassName,
  align = "end",
  children,
  disabled = false,
  disabledTitle,
}: {
  icon: React.ReactNode;
  label: string;
  panelClassName?: string;

  align?: "start" | "end";
  children: React.ReactNode;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  return (
    <div
      className={`dropdown dropdown-${align}`}
      onKeyDown={handleKeyDown}
    >
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        className={`btn btn-sm btn-ghost flex items-center gap-2 ${disabled ? "btn-disabled opacity-50" : ""}`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </div>
      {!disabled && (
        <div
          tabIndex={0}
          className={`dropdown-content bg-base-100 rounded-box z-10 mt-2 p-4 shadow ${panelClassName ?? "w-64"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
